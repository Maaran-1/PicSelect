import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/events/[id]/export
// Returns a CSV file of all selections for the event
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
            name: true,
            driveFileId: true,
          },
        },
      },
      orderBy: [{ clientName: "asc" }, { createdAt: "asc" }],
    });

    // Build CSV
    const rows: string[][] = [
      ["Client Name", "Client Email", "Photo Name", "Drive File ID", "Drive URL", "Submitted At"],
    ];

    for (const sel of selections) {
      rows.push([
        sel.clientName,
        sel.clientEmail ?? "",
        sel.photo.name,
        sel.photo.driveFileId,
        `https://drive.google.com/file/d/${sel.photo.driveFileId}/view`,
        sel.createdAt.toISOString(),
      ]);
    }

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            // Escape cells that contain commas, quotes, or newlines
            if (/[",\n\r]/.test(cell)) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(",")
      )
      .join("\n");

    const safeName = event.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}_selections.csv"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
