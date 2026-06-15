"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this event? All photos and selections will be removed.")) return;
    setLoading(true);
    await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-gray-400 hover:text-red-500 transition text-lg leading-none disabled:opacity-40"
      title="Delete event"
    >
      ✕
    </button>
  );
}
