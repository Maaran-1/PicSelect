"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhotoGrid } from "@/components/PhotoGrid";
import { Lightbox } from "@/components/Lightbox";
import { SelectionBar } from "@/components/SelectionBar";
import { ClientInfoModal } from "@/components/ClientInfoModal";

export interface Photo {
  id: string;
  driveFileId: string;
  name: string;
  thumbnailUrl: string | null;
  webContentUrl: string | null;
  width: number | null;
  height: number | null;
}

export interface GalleryEvent {
  id: string;
  name: string;
  description: string | null;
  photos: Photo[];
}

export default function GalleryPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [event, setEvent] = useState<GalleryEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(`/api/gallery/${token}`);
        if (!res.ok) {
          setError("Gallery not found or has been removed.");
          return;
        }
        const data = await res.json();
        setEvent(data);
      } catch {
        setError("Failed to load gallery. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [token]);

  const toggleSelect = useCallback((photoId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  }, []);

  const handleLightboxNav = useCallback(
    (dir: "prev" | "next") => {
      if (!lightboxPhoto || !event) return;
      const idx = event.photos.findIndex((p) => p.id === lightboxPhoto.id);
      const nextIdx = dir === "prev" ? idx - 1 : idx + 1;
      if (nextIdx >= 0 && nextIdx < event.photos.length) {
        setLightboxPhoto(event.photos[nextIdx]);
      }
    },
    [lightboxPhoto, event]
  );

  // Keyboard nav for lightbox
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightboxPhoto) return;
      if (e.key === "ArrowLeft") handleLightboxNav("prev");
      if (e.key === "ArrowRight") handleLightboxNav("next");
      if (e.key === "Escape") setLightboxPhoto(null);
      if (e.key === " ") {
        e.preventDefault();
        toggleSelect(lightboxPhoto.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxPhoto, handleLightboxNav, toggleSelect]);

  const handleSubmit = async (clientName: string, clientEmail: string) => {
    if (selected.size === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/gallery/${token}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoIds: Array.from(selected),
          clientName,
          clientEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push(`/gallery/${token}/success?name=${encodeURIComponent(clientName)}&count=${selected.size}`);
    } catch {
      alert("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading gallery…</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center px-4">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-white text-xl font-semibold mb-2">Gallery not found</h1>
          <p className="text-gray-400 text-sm">{error || "This gallery link may have expired."}</p>
        </div>
      </div>
    );
  }

  const currentLightboxIdx = lightboxPhoto
    ? event.photos.findIndex((p) => p.id === lightboxPhoto.id)
    : -1;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-950/90 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-white font-semibold truncate">{event.name}</h1>
            {event.description && (
              <p className="text-gray-400 text-xs truncate hidden sm:block">
                {event.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-gray-400 text-sm hidden sm:block">
              {event.photos.length} photos
            </span>
            {selected.size > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {selected.size} selected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Photo grid */}
      <div className="max-w-7xl mx-auto px-2 py-4">
        {event.photos.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500">No photos in this gallery yet.</p>
          </div>
        ) : (
          <PhotoGrid
            photos={event.photos}
            selected={selected}
            onToggleSelect={toggleSelect}
            onOpenLightbox={setLightboxPhoto}
          />
        )}
      </div>

      {/* Selection bar */}
      <SelectionBar
        count={selected.size}
        total={event.photos.length}
        onClear={() => setSelected(new Set())}
        onSubmit={() => setShowClientModal(true)}
      />

      {/* Lightbox */}
      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          isSelected={selected.has(lightboxPhoto.id)}
          onToggleSelect={() => toggleSelect(lightboxPhoto.id)}
          onClose={() => setLightboxPhoto(null)}
          onPrev={currentLightboxIdx > 0 ? () => handleLightboxNav("prev") : undefined}
          onNext={
            currentLightboxIdx < event.photos.length - 1
              ? () => handleLightboxNav("next")
              : undefined
          }
          currentIndex={currentLightboxIdx}
          total={event.photos.length}
        />
      )}

      {/* Client info modal */}
      {showClientModal && (
        <ClientInfoModal
          selectedCount={selected.size}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClose={() => setShowClientModal(false)}
        />
      )}
    </div>
  );
}
