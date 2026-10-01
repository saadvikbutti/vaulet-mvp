import test from "node:test";
import assert from "node:assert/strict";
import { calculateTotals } from "./vauletService.js";
import { createTravelPlan, isUsablePlan } from "./plannerService.js";

test("wallet totals add money in integer minor units", () => {
  const totals = calculateTotals([
    { type: "contribution", amount: 0.1 },
    { type: "contribution", amount: 0.2 },
    { type: "expense", amount: 0.1, category: "Food" },
    { type: "expense", amount: 0.2, category: "Food" },
    { type: "expense", amount: 0.05, category: "Transport" },
  ]);

  assert.deepEqual(totals, {
    contributed: 0.3,
    spent: 0.35,
    balance: -0.05,
    byCategory: { Food: 0.3, Transport: 0.05 },
  });
});

test("planner fallback never exceeds the requested budget", async () => {
  const originalKey = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  try {
    const plan = await createTravelPlan({
      destination: "Goa",
      people: 4,
      days: 4,
      budget: 40000,
      interests: "beaches, food",
    });
    assert.ok(plan.estimatedTotalCost <= plan.budget);
    assert.equal(plan.remainingBudget, plan.budget - plan.estimatedTotalCost);
    assert.equal(plan.itinerary.length, 4);
  } finally {
    if (originalKey !== undefined) process.env.AI_API_KEY = originalKey;
  }
});

test("planner rejects an empty destination", async () => {
  await assert.rejects(
    createTravelPlan({ destination: "", people: 2, days: 2, budget: 1000, interests: "" }),
    { status: 400 }
  );
});

test("planner fallback stays usable when optional interests contain no words", async () => {
  const originalKey = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  try {
    const plan = await createTravelPlan({ destination: "Osaka", people: 2, days: 2, budget: 15000, interests: ", ," });
    assert.equal(plan.itinerary.length, 2);
    assert.ok(plan.itinerary.every((day) => day.activities.every((activity) => !activity.includes("undefined"))));
  } finally {
    if (originalKey !== undefined) process.env.AI_API_KEY = originalKey;
  }
});

test("AI plan validation covers nested fields, destination, and the hard budget ceiling", () => {
  const plan = {
    destination: "Paris",
    allocation: [{ label: "Hotel", amount: 40, percent: 40 }],
    itinerary: [{ day: 1, title: "Arrival", activities: ["Check in"], estimatedCost: 40 }],
    hotelSuggestions: [{ name: "A hotel", note: "Near transit", pricePerNight: 40 }],
    activitySuggestions: ["Museum"],
    foodSuggestions: ["Market"],
    estimatedTotalCost: 80,
  };
  assert.equal(isUsablePlan(plan, 100, 1, "Paris"), true);
  assert.equal(isUsablePlan({ ...plan, destination: "Rome" }, 100, 1, "Paris"), false);
  assert.equal(isUsablePlan({ ...plan, itinerary: [{ ...plan.itinerary[0], activities: null }] }, 100, 1, "Paris"), false);
  assert.equal(isUsablePlan(plan, 79, 1, "Paris"), false);
  assert.equal(isUsablePlan({ ...plan, allocation: [{ label: "Hotel", amount: 101, percent: 100 }] }, 100, 1, "Paris"), false);
  assert.equal(isUsablePlan({ ...plan, allocation: [null] }, 100, 1, "Paris"), false);
  assert.equal(isUsablePlan({ ...plan, itinerary: [{ ...plan.itinerary[0], day: 2 }] }, 100, 1, "Paris"), false);
  assert.equal(isUsablePlan({ ...plan, hotelSuggestions: Array(7).fill(plan.hotelSuggestions[0]) }, 100, 1, "Paris"), false);
  assert.equal(isUsablePlan({ ...plan, hotelSuggestions: [{ ...plan.hotelSuggestions[0], pricePerNight: 101 }] }, 100, 1, "Paris"), false);
  assert.equal(isUsablePlan({ ...plan, estimatedTotalCost: 39 }, 100, 1, "Paris"), false);
});
