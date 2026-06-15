import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/events — create a new event
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, driveFolderId } = await req.json();

    if (!name || !driveFolderId) {
      return NextResponse.json(
        { error: "Name and Drive folder ID are required." },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name,
        description: description || null,
        driveFolderId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("Create event error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// GET /api/events — list photographer's events
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await prisma.event.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { photos: true, selections: true } },
      },
    });

    return NextResponse.json(events);
  } catch (err) {
    console.error("List events error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
