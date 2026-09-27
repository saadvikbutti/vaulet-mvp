"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MemoryUploadForm({ vauletId }: { vauletId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose a photo first");
      return;
    }
    setLoading(true);

    const form = new FormData();
    form.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      setError(uploadData.error || "Upload failed");
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/vaulets/${vauletId}/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: uploadData.url, caption: caption || undefined, location: location || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    setFile(null);
    setCaption("");
    setLocation("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="bg-white border border-line rounded-xl p-5 space-y-3">
      <h3 className="font-semibold">Add a memory</h3>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm"
      />
      <input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption (optional)"
        className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location (optional)"
        className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-ink text-white py-2.5 font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "Uploading…" : "Add memory"}
      </button>
    </form>
  );
}
