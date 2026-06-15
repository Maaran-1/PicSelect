"use client";

import { Photo } from "@/app/gallery/[token]/page";
import { memo } from "react";

interface PhotoGridProps {
  photos: Photo[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenLightbox: (photo: Photo) => void;
}

export const PhotoGrid = memo(function PhotoGrid({
  photos,
  selected,
  onToggleSelect,
  onOpenLightbox,
}: PhotoGridProps) {
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2 space-y-2">
      {photos.map((photo) => (
        <PhotoTile
          key={photo.id}
          photo={photo}
          isSelected={selected.has(photo.id)}
          onToggleSelect={onToggleSelect}
          onOpenLightbox={onOpenLightbox}
        />
      ))}
    </div>
  );
});

interface PhotoTileProps {
  photo: Photo;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenLightbox: (photo: Photo) => void;
}

const PhotoTile = memo(function PhotoTile({
  photo,
  isSelected,
  onToggleSelect,
  onOpenLightbox,
}: PhotoTileProps) {
  const thumbUrl =
    photo.thumbnailUrl ||
    `https://drive.google.com/thumbnail?id=${photo.driveFileId}&sz=w400`;

  return (
    <div
      className={`relative break-inside-avoid rounded-lg overflow-hidden cursor-pointer group mb-2 ${
        isSelected ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-950" : ""
      }`}
    >
      {/* Photo */}
      <div
        className="relative"
        onClick={() => onOpenLightbox(photo)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl}
          alt={photo.name}
          className="w-full h-auto block"
          loading="lazy"
        />
        {/* Hover overlay */}
        <div
          className={`absolute inset-0 transition-opacity ${
            isSelected
              ? "bg-blue-600/20"
              : "bg-black/0 group-hover:bg-black/20"
          }`}
        />
      </div>

      {/* Select checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(photo.id);
        }}
        className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected
            ? "bg-blue-600 border-blue-600"
            : "bg-black/40 border-white/60 opacity-0 group-hover:opacity-100"
        }`}
        aria-label={isSelected ? "Deselect photo" : "Select photo"}
      >
        {isSelected && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Photo name on hover */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <p className="text-white text-xs truncate">{photo.name}</p>
      </div>
    </div>
  );
});
