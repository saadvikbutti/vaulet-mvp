"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddMemberForm({ vauletId }: { vauletId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/vaulets/${vauletId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }
    setEmail("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="friend@email.com"
        required
        className="flex-1 rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Adding…" : "Add"}
      </button>
      {error && <p className="text-sm text-red-600 self-center">{error}</p>}
    </form>
  );
}
