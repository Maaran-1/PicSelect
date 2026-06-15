import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/gallery/[token]/select
// Public endpoint — client submits their photo selections
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { photoIds, clientName, clientEmail } = await req.json();

    if (!clientName || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: "Client name and at least one photo selection are required." },
        { status: 400 }
      );
    }

    // Find event by share token
    const event = await prisma.event.findUnique({
      where: { shareToken: params.token },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
    }

    // Validate all photoIds belong to this event
    const validPhotos = await prisma.photo.findMany({
      where: {
        id: { in: photoIds as string[] },
        eventId: event.id,
      },
      select: { id: true },
    });

    const validIds = new Set<string>(validPhotos.map((p: { id: string }) => p.id));
    const filteredIds = (photoIds as string[]).filter((id) => validIds.has(id));

    if (filteredIds.length === 0) {
      return NextResponse.json(
        { error: "No valid photos found." },
        { status: 400 }
      );
    }

    // Delete previous selections from this client for this event (allow resubmit)
    await prisma.selection.deleteMany({
      where: {
        eventId: event.id,
        clientName: clientName.trim(),
      },
    });

    // Insert new selections
    await prisma.selection.createMany({
      data: filteredIds.map((photoId) => ({
        eventId: event.id,
        photoId,
        clientName: (clientName as string).trim(),
        clientEmail: clientEmail ? (clientEmail as string).trim() || null : null,
      })),
    });

    return NextResponse.json({ success: true, count: filteredIds.length });
  } catch (err) {
    console.error("Selection submit error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
