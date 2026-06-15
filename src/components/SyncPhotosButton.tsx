"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncPhotosButton({
  eventId,
  folderId,
}: {
  eventId: string;
  folderId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleSync = async () => {
    setLoading(true);
    setStatus("Syncing…");

    const res = await fetch(`/api/events/${eventId}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setStatus(`✓ ${data.count} photos loaded`);
      router.refresh();
      setTimeout(() => setStatus(""), 3000);
    } else {
      setStatus(`Error: ${data.error || "Failed"}`);
      setTimeout(() => setStatus(""), 4000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-700 rounded-lg text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Syncing…" : "Sync Photos from Drive"}
      </button>
      {status && (
        <span className="text-sm text-gray-500">{status}</span>
      )}
    </div>
  );
}
