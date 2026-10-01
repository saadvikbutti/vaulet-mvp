import { HttpError } from "../utils/HttpError.js";
import { generatePlanWithProvider } from "./aiService.js";

const COST_SPLIT = { Hotel: 0.35, Food: 0.25, Transport: 0.15, Activities: 0.2, Buffer: 0.05 };

export async function createTravelPlan(input) {
  if (!input.destination.trim()) throw new HttpError(400, "Destination is required.");
  const budget = Number(input.budget);
  if (!Number.isFinite(budget) || budget <= 0) throw new HttpError(400, "Budget must be greater than zero.");

  if (process.env.AI_API_KEY) {
    try {
      const plan = await generatePlanWithProvider({ ...input, budget });
      if (isUsablePlan(plan, budget, Number(input.days), input.destination)) {
        return { ...plan, destination: input.destination, budget, remainingBudget: Math.max(0, budget - plan.estimatedTotalCost) };
      }
    } catch (error) {
      console.warn("AI planner call failed; using the local fallback:", error.message);
    }
  }

  return createSamplePlan({ ...input, budget });
}

export function isUsablePlan(plan, budget, expectedDays, expectedDestination) {
  const isText = (value, maxLength) => typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
  if (!plan || !isText(plan.destination, 120) || plan.destination.trim() !== expectedDestination) return false;
  if (!Array.isArray(plan.allocation) || plan.allocation.length < 1 || plan.allocation.length > 10) return false;
  if (!Array.isArray(plan.itinerary) || plan.itinerary.length !== expectedDays) return false;
  if (!Array.isArray(plan.hotelSuggestions) || plan.hotelSuggestions.length > 6) return false;
  if (!Array.isArray(plan.activitySuggestions) || plan.activitySuggestions.length > 12) return false;
  if (!Array.isArray(plan.foodSuggestions) || plan.foodSuggestions.length > 12) return false;
  if (!Number.isFinite(plan.estimatedTotalCost) || plan.estimatedTotalCost < 0 || plan.estimatedTotalCost > budget) return false;

  const allocationIsSafe = plan.allocation.every((item) =>
    item && isText(item.label, 80) && Number.isFinite(item.amount) && item.amount >= 0 && item.amount <= budget &&
    Number.isFinite(item.percent) && item.percent >= 0 && item.percent <= 100
  );
  if (!allocationIsSafe) return false;
  const allocatedTotal = plan.allocation.reduce((sum, item) => sum + item.amount, 0);
  if (allocatedTotal > budget) return false;

  let dailyCostTotal = 0;
  const itineraryIsSafe = plan.itinerary.every((day, index) => {
    if (!day || day.day !== index + 1 || !isText(day.title, 160)) return false;
    if (!Array.isArray(day.activities) || day.activities.length > 12 || !day.activities.every((activity) => isText(activity, 240))) return false;
    if (!Number.isFinite(day.estimatedCost) || day.estimatedCost < 0 || day.estimatedCost > budget) return false;
    dailyCostTotal += day.estimatedCost;
    return true;
  });
  if (!itineraryIsSafe || dailyCostTotal > budget || dailyCostTotal > plan.estimatedTotalCost) return false;

  const hotelsAreSafe = plan.hotelSuggestions.every((hotel) =>
    hotel && isText(hotel.name, 200) && isText(hotel.note, 300) &&
    Number.isFinite(hotel.pricePerNight) && hotel.pricePerNight >= 0 && hotel.pricePerNight <= budget
  );
  const activitiesAreSafe = plan.activitySuggestions.every((item) => isText(item, 240));
  const foodIsSafe = plan.foodSuggestions.every((item) => isText(item, 240));
  return hotelsAreSafe && activitiesAreSafe && foodIsSafe;
}

function createSamplePlan(input) {
  const days = Math.min(30, Math.max(1, Math.floor(Number(input.days) || 1)));
  const people = Math.min(50, Math.max(1, Math.floor(Number(input.people) || 1)));
  const themes = String(input.interests || "local sightseeing, food, relaxation").split(",").map((item) => item.trim()).filter(Boolean);
  if (themes.length === 0) themes.push("local sightseeing", "food", "relaxation");
  const allocation = Object.entries(COST_SPLIT).map(([label, percent]) => ({
    label,
    percent: Math.round(percent * 100),
    amount: Math.round(input.budget * percent),
  }));
  const dailyCost = Math.floor((input.budget * 0.6) / days);
  const itinerary = Array.from({ length: days }, (_, index) => ({
    day: index + 1,
    title: index === 0 ? `Arrival and first look at ${input.destination}` : `Day ${index + 1}: ${themes[index % themes.length]}`,
    activities: [
      index === 0 ? "Arrive, check in, and explore nearby" : `Morning: ${themes[index % themes.length]} for the group`,
      "Afternoon: find a local meal within budget",
      index === days - 1 ? "Pack, check out, and head home" : "Evening: relaxed group time",
    ],
    estimatedCost: dailyCost,
  }));
  const estimatedTotalCost = Math.min(input.budget, dailyCost * days + Math.floor(input.budget * 0.35));
  const perNight = Math.floor((input.budget * 0.35) / days);

  return {
    destination: input.destination,
    budget: input.budget,
    allocation,
    itinerary,
    hotelSuggestions: [
      { name: `Budget stay near ${input.destination} center`, pricePerNight: Math.floor(perNight * 0.7), note: "A practical group option" },
      { name: `Shared-room hotel in ${input.destination}`, pricePerNight: perNight, note: `Sized for a group of ${people}` },
    ],
    activitySuggestions: themes.map((theme) => `${theme} around ${input.destination}`),
    foodSuggestions: ["Local street-food crawl", "One shared group dinner", "Casual breakfast cafés"],
    estimatedTotalCost,
    remainingBudget: Math.max(0, input.budget - estimatedTotalCost),
  };
}
