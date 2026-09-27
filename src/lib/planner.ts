export interface PlannerInput {
  destination: string;
  people: number;
  days: number;
  budget: number;
  interests: string;
}

export interface PlannerDay {
  day: number;
  title: string;
  activities: string[];
  estimatedCost: number;
}

export interface PlannerPlan {
  destination: string;
  budget: number;
  allocation: { label: string; amount: number; percent: number }[];
  itinerary: PlannerDay[];
  hotelSuggestions: { name: string; pricePerNight: number; note: string }[];
  activitySuggestions: string[];
  foodSuggestions: string[];
  estimatedTotalCost: number;
  remainingBudget: number;
}

// Real-plan path: only runs if ANTHROPIC_API_KEY is configured server-side.
// The prompt instructs the model to treat `budget` as a hard ceiling and to
// return strict JSON matching PlannerPlan, which we parse and validate.
// If it's missing, over budget, or malformed, we fall back to the mock —
// so the feature always works, live API or not.
export async function generatePlan(input: PlannerInput): Promise<PlannerPlan> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const plan = await generatePlanWithAI(input, apiKey);
      if (plan && plan.estimatedTotalCost <= input.budget * 1.02) return plan;
    } catch {
      // fall through to mock
    }
  }
  return generateMockPlan(input);
}

async function generatePlanWithAI(input: PlannerInput, apiKey: string): Promise<PlannerPlan | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Plan a ${input.days}-day trip to ${input.destination} for ${input.people} people, interested in ${input.interests}. HARD BUDGET CEILING: ${input.budget} (total, all-inclusive). The plan MUST NOT exceed this budget. Respond with ONLY valid JSON matching this TypeScript type, no prose, no markdown fences:
{"destination": string, "budget": number, "allocation": {"label": string, "amount": number, "percent": number}[], "itinerary": {"day": number, "title": string, "activities": string[], "estimatedCost": number}[], "hotelSuggestions": {"name": string, "pricePerNight": number, "note": string}[], "activitySuggestions": string[], "foodSuggestions": string[], "estimatedTotalCost": number, "remainingBudget": number}`,
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = (data.content || []).map((b: { text?: string }) => b.text || "").join("");
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as PlannerPlan;
}

// Deterministic, budget-safe mock so the whole flow works with zero
// external dependencies. Allocation percentages are a simple, common
// trip breakdown; swap this out once a real provider/travel API is wired in.
function generateMockPlan(input: PlannerInput): PlannerPlan {
  const { destination, people, days, budget, interests } = input;

  const split = { Hotel: 0.35, Food: 0.25, Transport: 0.15, Activities: 0.2, Buffer: 0.05 };
  const allocation = Object.entries(split).map(([label, percent]) => ({
    label,
    percent: Math.round(percent * 100),
    amount: Math.round(budget * percent),
  }));

  const hotelBudget = budget * split.Hotel;
  const perNight = Math.max(500, Math.floor(hotelBudget / Math.max(days, 1) / 10) * 10);

  const interestList = interests
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const themes = interestList.length ? interestList : ["local sightseeing", "food", "relaxation"];

  const perDayActivityBudget = (budget * split.Activities) / Math.max(days, 1);
  const perDayFoodBudget = (budget * split.Food) / Math.max(days, 1);
  const perDayTransportBudget = (budget * split.Transport) / Math.max(days, 1);

  const itinerary: PlannerDay[] = Array.from({ length: days }, (_, i) => {
    const theme = themes[i % themes.length];
    const dayCost = Math.round(perDayActivityBudget + perDayFoodBudget + perDayTransportBudget);
    return {
      day: i + 1,
      title: i === 0 ? `Arrival & first taste of ${theme}` : i === days - 1 ? "Wind down & departure" : `Focus on ${theme}`,
      activities: [
        i === 0 ? `Arrive, check in, evening exploring near the hotel` : `Morning: ${theme} activity for the group`,
        `Afternoon: local food spot within budget`,
        i === days - 1 ? `Pack up, last-minute shopping, head to transport` : `Evening: relaxed group time`,
      ],
      estimatedCost: dayCost,
    };
  });

  // Hotel + sum of daily costs, scaled down if it would exceed budget —
  // the budget is a hard ceiling, never a suggestion.
  const hotelTotal = perNight * days;
  const dailyTotal = itinerary.reduce((s, d) => s + d.estimatedCost, 0);
  const rawTotal = hotelTotal + dailyTotal;
  const scale = rawTotal > budget ? budget / rawTotal : 1;

  const scaledItinerary = itinerary.map((d) => ({ ...d, estimatedCost: Math.round(d.estimatedCost * scale) }));
  const scaledHotelTotal = Math.round(hotelTotal * scale);
  const finalTotal = scaledHotelTotal + scaledItinerary.reduce((s, d) => s + d.estimatedCost, 0);

  return {
    destination,
    budget,
    allocation,
    itinerary: scaledItinerary,
    hotelSuggestions: [
      { name: `Budget stay near ${destination} center`, pricePerNight: Math.round(perNight * 0.7), note: "Good for groups watching spend" },
      { name: `Mid-range hotel, ${destination}`, pricePerNight: Math.round(perNight), note: `Fits ${people} people across shared rooms` },
      { name: `Comfort option, ${destination}`, pricePerNight: Math.round(perNight * 1.3), note: "Slightly above average — trim activities to afford it" },
    ],
    activitySuggestions: themes.map((t) => `${t} experience in ${destination}`),
    foodSuggestions: [`Local street food crawl`, `One sit-down group dinner`, `Casual cafes for breakfast/lunch`],
    estimatedTotalCost: finalTotal,
    remainingBudget: Math.max(0, budget - finalTotal),
  };
}
