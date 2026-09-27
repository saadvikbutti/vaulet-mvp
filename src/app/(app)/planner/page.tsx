"use client";

import { useState } from "react";
import type { PlannerPlan } from "@/lib/planner";
import { formatMoney } from "@/components/BalanceCard";

export default function PlannerPage() {
  const [destination, setDestination] = useState("");
  const [people, setPeople] = useState("4");
  const [days, setDays] = useState("4");
  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState("");
  const [plan, setPlan] = useState<PlannerPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPlan(null);
    setLoading(true);
    const res = await fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination,
        people: Number(people),
        days: Number(days),
        budget: Number(budget),
        interests,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }
    setPlan(data);
    setLoading(false);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-semibold mb-1">AI Planner</h1>
        <p className="text-sm text-muted mb-6">Tell it your budget — it treats that as a hard ceiling.</p>
        <form onSubmit={onSubmit} className="space-y-4 bg-white border border-line rounded-xl p-6">
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Destination</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Goa"
              required
              className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1">People</label>
              <input
                type="number"
                min="1"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                required
                className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1">Days</label>
              <input
                type="number"
                min="1"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                required
                className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Total budget</label>
            <input
              type="number"
              min="1"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="40000"
              required
              className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Interests</label>
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="beaches, adventure, nightlife"
              className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ink text-white py-2.5 font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Planning…" : "Generate plan"}
          </button>
        </form>
      </div>

      <div>
        {!plan && !loading && (
          <div className="h-full flex items-center justify-center text-sm text-muted bg-white border border-dashed border-line rounded-xl p-8">
            Your plan will appear here.
          </div>
        )}
        {plan && (
          <div className="space-y-5">
            <div className="bg-white border border-line rounded-xl p-5">
              <div className="flex justify-between items-baseline">
                <h2 className="text-lg font-semibold">{plan.destination}</h2>
                <span className="text-sm text-muted">Budget {formatMoney(plan.budget)}</span>
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span>Estimated total: <strong>{formatMoney(plan.estimatedTotalCost)}</strong></span>
                <span className="text-accent font-medium">{formatMoney(plan.remainingBudget)} left</span>
              </div>
            </div>

            <div className="bg-white border border-line rounded-xl p-5">
              <h3 className="font-semibold mb-3">Budget allocation</h3>
              <div className="space-y-2">
                {plan.allocation.map((a) => (
                  <div key={a.label} className="flex justify-between text-sm">
                    <span>{a.label} ({a.percent}%)</span>
                    <span className="font-medium">{formatMoney(a.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-line rounded-xl p-5">
              <h3 className="font-semibold mb-3">Day-by-day itinerary</h3>
              <div className="space-y-4">
                {plan.itinerary.map((d) => (
                  <div key={d.day} className="border-l-2 border-accent/40 pl-3">
                    <p className="text-sm font-medium">
                      Day {d.day}: {d.title} — {formatMoney(d.estimatedCost)}
                    </p>
                    <ul className="text-sm text-muted list-disc list-inside mt-1">
                      {d.activities.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-line rounded-xl p-5">
              <h3 className="font-semibold mb-3">Hotel suggestions</h3>
              <div className="space-y-2">
                {plan.hotelSuggestions.map((h, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{h.name}</p>
                      <p className="text-muted text-xs">{h.note}</p>
                    </div>
                    <span className="font-medium">{formatMoney(h.pricePerNight)}/night</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white border border-line rounded-xl p-5">
                <h3 className="font-semibold mb-2">Activities</h3>
                <ul className="text-sm text-muted list-disc list-inside space-y-1">
                  {plan.activitySuggestions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white border border-line rounded-xl p-5">
                <h3 className="font-semibold mb-2">Food</h3>
                <ul className="text-sm text-muted list-disc list-inside space-y-1">
                  {plan.foodSuggestions.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
