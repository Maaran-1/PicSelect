import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/gallery/[token]
// Public endpoint — returns event + photos for the client gallery view
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { shareToken: params.token },
      select: {
        id: true,
        name: true,
        description: true,
        photos: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            driveFileId: true,
            name: true,
            thumbnailUrl: true,
            webContentUrl: true,
            width: true,
            height: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (err) {
    console.error("Gallery fetch error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
