"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Food", "Hotel", "Transport", "Activities", "Shopping", "Tickets", "Other"];

export function TransactionForm({ vauletId, type }: { vauletId: string; type: "contribution" | "expense" }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [merchant, setMerchant] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter an amount greater than 0");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/vaulets/${vauletId}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        amount: numericAmount,
        description: description || undefined,
        category: type === "expense" ? category : undefined,
        merchant: type === "expense" ? merchant || undefined : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }
    setAmount("");
    setDescription("");
    setMerchant("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 bg-white border border-line rounded-xl p-5">
      <h3 className="font-semibold">{type === "contribution" ? "Add money" : "Add an expense"}</h3>
      <div>
        <label className="block text-sm font-medium text-ink/80 mb-1">Amount</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink/80 mb-1">
          {type === "contribution" ? "Note (optional)" : "Description"}
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required={type === "expense"}
          placeholder={type === "expense" ? "Dinner" : "e.g. UPI transfer"}
          className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
      </div>
      {type === "expense" && (
        <>
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Merchant / location (optional)</label>
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-ink text-white py-2.5 font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "Saving…" : type === "contribution" ? "Add money" : "Add expense"}
      </button>
    </form>
  );
}
