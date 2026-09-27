"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

export default function NewVauletPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/vaulets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || undefined,
        currency,
        budget: budget ? Number(budget) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }
    router.push(`/vaulets/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Create a Vaulet</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-white border border-line rounded-xl p-6">
        <div>
          <label className="block text-sm font-medium text-ink/80 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Goa Trip 2026"
            required
            className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80 mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Target budget (optional)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="40000"
              className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-ink text-white py-2.5 font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Vaulet"}
        </button>
      </form>
    </div>
  );
}
