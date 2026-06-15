import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SelectionPhotoInfo {
  id: string;
  name: string;
  driveFileId: string;
  thumbnailUrl: string | null;
}

interface ClientRecord {
  clientName: string;
  clientEmail: string | null;
  submittedAt: Date;
  photos: SelectionPhotoInfo[];
}

// GET /api/events/[id]/selections
export async function GET(
  _req: NextRequest,
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

    const selections = await prisma.selection.findMany({
      where: { eventId: params.id },
      include: {
        photo: {
          select: {
            id: true,
            name: true,
            driveFileId: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: [{ clientName: "asc" }, { createdAt: "asc" }],
    });

    const byClient: Record<string, ClientRecord> = {};

    for (const sel of selections) {
      if (!byClient[sel.clientName]) {
        byClient[sel.clientName] = {
          clientName: sel.clientName,
          clientEmail: sel.clientEmail,
          submittedAt: sel.createdAt,
          photos: [],
        };
      }
      byClient[sel.clientName].photos.push(sel.photo);
    }

    return NextResponse.json({
      eventId: params.id,
      eventName: event.name,
      clients: Object.values(byClient),
      totalSelections: selections.length,
    });
  } catch (err) {
    console.error("Get selections error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
