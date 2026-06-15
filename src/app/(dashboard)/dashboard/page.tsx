import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteEventButton } from "@/components/DeleteEventButton";

interface EventWithCount {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  _count: {
    photos: number;
    selections: number;
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const events: EventWithCount[] = await prisma.event.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { photos: true, selections: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your photo galleries and client selections
          </p>
        </div>
        <Link
          href="/events/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <div className="text-4xl mb-3">📷</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">No events yet</h2>
          <p className="text-gray-500 text-sm mb-6">
            Create your first event to share a Google Drive gallery with your clients.
          </p>
          <Link
            href="/events/new"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Create Event
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event: EventWithCount) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 truncate">{event.name}</h2>
                  {event.description && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{event.description}</p>
                  )}
                </div>
                <DeleteEventButton eventId={event.id} />
              </div>

              <div className="flex gap-4 text-sm text-gray-500">
                <span>🖼 {event._count.photos} photos</span>
                <span>✅ {event._count.selections} selections</span>
              </div>

              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                <Link
                  href={`/events/${event.id}`}
                  className="flex-1 text-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-2 rounded-lg transition"
                >
                  View
                </Link>
                <Link
                  href={`/events/${event.id}/selections`}
                  className="flex-1 text-center text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-3 py-2 rounded-lg transition"
                >
                  Selections
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
