import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExportButton } from "@/components/ExportButton";

interface SelectionPhoto {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  driveFileId: string;
}

interface ClientGroup {
  clientName: string;
  clientEmail: string | null;
  submittedAt: Date;
  photos: SelectionPhoto[];
}

export default async function SelectionsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const event = await prisma.event.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!event) notFound();

  const selections = await prisma.selection.findMany({
    where: { eventId: params.id },
    include: {
      photo: {
        select: {
          id: true,
          name: true,
          thumbnailUrl: true,
          driveFileId: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const byClient: Record<string, ClientGroup> = {};

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
    if (sel.createdAt > byClient[sel.clientName].submittedAt) {
      byClient[sel.clientName].submittedAt = sel.createdAt;
    }
  }

  const clients: ClientGroup[] = Object.values(byClient).sort(
    (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
  );

  const totalPhotos = await prisma.photo.count({ where: { eventId: params.id } });
  const uniquePhotoIds = new Set(selections.map((s: { photoId: string }) => s.photoId));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/events/${params.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {event.name}
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Selections</h1>
          <p className="text-gray-500 text-sm mt-1">
            {clients.length} client{clients.length !== 1 ? "s" : ""} ·{" "}
            {selections.length} total selections ·{" "}
            {uniquePhotoIds.size} unique photos out of {totalPhotos}
          </p>
        </div>
        {selections.length > 0 && (
          <ExportButton eventId={params.id} eventName={event.name} />
        )}
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <div className="text-4xl mb-3">⏳</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            No selections yet
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            Share the gallery link with your client to get started.
          </p>
          <div className="text-sm text-gray-400 font-mono bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 inline-block">
            {process.env.NEXT_PUBLIC_APP_URL}/gallery/{event.shareToken}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {clients.map((client) => (
            <div
              key={client.clientName}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      {client.clientName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-900">
                      {client.clientName}
                    </span>
                    {client.clientEmail && (
                      <span className="text-gray-400 text-sm">
                        · {client.clientEmail}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-9">
                    Submitted{" "}
                    {new Date(client.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                  {client.photos.length} photo{client.photos.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {client.photos.map((photo) => {
                    const thumb =
                      photo.thumbnailUrl ||
                      `https://drive.google.com/thumbnail?id=${photo.driveFileId}&sz=w200`;
                    return (
                      <div
                        key={photo.id}
                        className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 group"
                        title={photo.name}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumb}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-end justify-start p-1">
                          <span className="text-white text-xs opacity-0 group-hover:opacity-100 truncate max-w-full leading-tight">
                            {photo.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <details className="mt-3">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                    Show file names
                  </summary>
                  <ul className="mt-2 text-xs text-gray-500 space-y-0.5 ml-2">
                    {client.photos.map((photo) => (
                      <li key={photo.id} className="font-mono">
                        {photo.name}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
