import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listDrivePhotos, buildThumbnailUrl, buildViewUrl } from "@/lib/drive";

// POST /api/events/[id]/sync
// Fetches photos from Drive folder and upserts them into DB
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const event = await prisma.event.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // Get access token from session (stored during Google OAuth)
    const accessToken = session.accessToken;

    let drivePhotos;

    if (accessToken) {
      // Use photographer's OAuth token — full access to their Drive
      drivePhotos = await listDrivePhotos(event.driveFolderId, accessToken);
    } else {
      // Fallback: try public access via API key for publicly shared folders
      drivePhotos = await listDrivePhotosPublic(event.driveFolderId);
    }

    if (drivePhotos.length === 0) {
      return NextResponse.json({
        count: 0,
        message:
          "No images found in this folder. Make sure the folder contains images and is accessible.",
      });
    }

    // Upsert all photos (safe to re-sync)
    let upsertCount = 0;
    for (const photo of drivePhotos) {
      await prisma.photo.upsert({
        where: {
          eventId_driveFileId: {
            eventId: event.id,
            driveFileId: photo.id,
          },
        },
        update: {
          name: photo.name,
          thumbnailUrl: photo.thumbnailUrl ?? buildThumbnailUrl(photo.id),
          webContentUrl: photo.webContentUrl ?? buildViewUrl(photo.id),
          width: photo.width,
          height: photo.height,
        },
        create: {
          eventId: event.id,
          driveFileId: photo.id,
          name: photo.name,
          thumbnailUrl: photo.thumbnailUrl ?? buildThumbnailUrl(photo.id),
          webContentUrl: photo.webContentUrl ?? buildViewUrl(photo.id),
          width: photo.width,
          height: photo.height,
        },
      });
      upsertCount++;
    }

    return NextResponse.json({ count: upsertCount, success: true });
  } catch (err: any) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to sync photos." },
      { status: 500 }
    );
  }
}

/**
 * Public fallback: uses Google Drive API with no auth for publicly shared folders.
 * Requires GOOGLE_API_KEY env var.
 */
async function listDrivePhotosPublic(folderId: string) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No access token available. Please sign in with Google to sync Drive photos, or set GOOGLE_API_KEY for public folders."
    );
  }

  const photos = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields:
        "nextPageToken, files(id, name, thumbnailLink, webContentLink, imageMediaMetadata(width, height))",
      pageSize: "1000",
      orderBy: "name_natural",
      key: apiKey,
      ...(pageToken ? { pageToken } : {}),
    });

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Drive API error ${res.status}: ${err?.error?.message || res.statusText}`
      );
    }

    const data = await res.json();
    const files = data.files || [];

    for (const file of files) {
      photos.push({
        id: file.id,
        name: file.name,
        thumbnailUrl: file.thumbnailLink
          ? file.thumbnailLink.replace(/=s\d+$/, "=s400")
          : null,
        webContentUrl: file.webContentLink || null,
        width: file.imageMediaMetadata?.width ?? null,
        height: file.imageMediaMetadata?.height ?? null,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return photos;
}
