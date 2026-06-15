"use client";

import { Photo } from "@/app/gallery/[token]/page";
import { useEffect } from "react";

interface LightboxProps {
  photo: Photo;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  currentIndex: number;
  total: number;
}

export function Lightbox({
  photo,
  isSelected,
  onToggleSelect,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  total,
}: LightboxProps) {
  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const viewUrl =
    photo.webContentUrl ||
    `https://drive.google.com/uc?export=view&id=${photo.driveFileId}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-gray-400 text-sm">
          {currentIndex + 1} / {total}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSelect}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isSelected
                ? "bg-blue-600 text-white"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {isSelected ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Selected
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Select
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        className="flex-1 flex items-center justify-center relative px-12 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prev */}
        {onPrev && (
          <button
            onClick={onPrev}
            className="absolute left-2 text-white bg-white/10 hover:bg-white/25 transition rounded-full p-2"
            aria-label="Previous photo"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={viewUrl}
          alt={photo.name}
          className="max-h-full max-w-full object-contain select-none"
          style={{ maxHeight: "calc(100vh - 140px)" }}
        />

        {/* Next */}
        {onNext && (
          <button
            onClick={onNext}
            className="absolute right-2 text-white bg-white/10 hover:bg-white/25 transition rounded-full p-2"
            aria-label="Next photo"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div
        className="px-4 py-3 text-center shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-gray-400 text-xs truncate">{photo.name}</p>
        <p className="text-gray-600 text-xs mt-0.5">
          Space to select · ← → to navigate · Esc to close
        </p>
      </div>
    </div>
  );
}
