import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { SyncPhotosButton } from "@/components/SyncPhotosButton";

interface PreviewPhoto {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  createdAt: Date;
}

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const event = await prisma.event.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      _count: { select: { photos: true, selections: true } },
      photos: { take: 6, orderBy: { createdAt: "asc" } },
    },
  });

  if (!event) notFound();

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/gallery/${event.shareToken}`;

  const uniqueClients = await prisma.selection.groupBy({
    by: ["clientName"],
    where: { eventId: event.id },
  });

  const photos: PreviewPhoto[] = event.photos;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{event.name}</h1>
            {event.description && (
              <p className="text-gray-500 text-sm mt-1">{event.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Created {new Date(event.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-100 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{event._count.photos}</div>
            <div className="text-xs text-gray-500 mt-0.5">Photos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{event._count.selections}</div>
            <div className="text-xs text-gray-500 mt-0.5">Selections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{uniqueClients.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Clients</div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Share Link
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600 font-mono truncate"
            />
            <CopyLinkButton url={shareUrl} />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Share this link with your client so they can browse and select photos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <SyncPhotosButton eventId={event.id} folderId={event.driveFolderId} />
          <Link
            href={`/events/${event.id}/selections`}
            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition"
          >
            View Selections
          </Link>
          <a
            href={`https://drive.google.com/drive/folders/${event.driveFolderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
          >
            Open in Drive ↗
          </a>
        </div>
      </div>

      {photos.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Photo Preview ({event._count.photos} total)
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo: PreviewPhoto) => (
              <div
                key={photo.id}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
              >
                {photo.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                    🖼
                  </div>
                )}
              </div>
            ))}
          </div>
          {event._count.photos > 6 && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              +{event._count.photos - 6} more photos in gallery
            </p>
          )}
        </div>
      )}

      {event._count.photos === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="text-3xl mb-2">🔄</div>
          <p className="text-gray-500 text-sm">
            No photos loaded yet. Click &quot;Sync Photos from Drive&quot; to load them.
          </p>
        </div>
      )}
    </div>
  );
}
