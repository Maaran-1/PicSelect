/**
 * Google Drive Service
 * Fetches image metadata from a Drive folder using the Drive API v3.
 * Uses the photographer's OAuth access token from the session.
 * Falls back to public API key access for publicly shared folders.
 */

export interface DrivePhoto {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  webContentUrl: string | null;
  width: number | null;
  height: number | null;
}

interface DriveFile {
  id: string;
  name: string;
  thumbnailLink?: string;
  webContentLink?: string;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
  };
}

interface DriveFilesResponse {
  files?: DriveFile[];
  nextPageToken?: string;
}

const DRIVE_API = "https://www.googleapis.com/drive/v3";

/**
 * List all image files in a Drive folder.
 * Uses the provided OAuth access token (from the photographer's session).
 */
export async function listDrivePhotos(
  folderId: string,
  accessToken: string
): Promise<DrivePhoto[]> {
  const photos: DrivePhoto[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields:
        "nextPageToken, files(id, name, thumbnailLink, webContentLink, imageMediaMetadata(width, height))",
      pageSize: "1000",
      orderBy: "name_natural",
      ...(pageToken ? { pageToken } : {}),
    });

    const res = await fetch(`${DRIVE_API}/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Drive API error ${res.status}: ${(err as any)?.error?.message || res.statusText}`
      );
    }

    const data: DriveFilesResponse = await res.json();
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

/**
 * Verify a folder exists and is accessible.
 */
export async function getDriveFolder(
  folderId: string,
  accessToken: string
): Promise<{ id: string; name: string } | null> {
  const params = new URLSearchParams({
    fields: "id, name, mimeType",
  });

  const res = await fetch(`${DRIVE_API}/files/${folderId}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;

  const data = await res.json();

  if (data.mimeType !== "application/vnd.google-apps.folder") {
    throw new Error("The provided link is not a folder.");
  }

  return { id: data.id, name: data.name };
}

/**
 * Build a direct thumbnail URL for a Drive file.
 * Works for publicly shared files without auth.
 */
export function buildThumbnailUrl(fileId: string, size = 400): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=s${size}`;
}

/**
 * Build a direct download/view URL for a Drive file.
 */
export function buildViewUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}
