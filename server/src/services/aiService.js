// Provider credentials and HTTP details stay on the API server. To add another
// provider, implement another function here and select it using AI_PROVIDER.
export async function generatePlanWithProvider(input) {
  const provider = process.env.AI_PROVIDER || "anthropic";
  if (provider === "anthropic") return requestAnthropicPlan(input);
  throw new Error(`No AI adapter is configured for provider: ${provider}`);
}

async function requestAnthropicPlan(input) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.AI_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "claude-3-5-haiku-latest",
      max_tokens: 2400,
      messages: [{
        role: "user",
        content: `Create a realistic ${input.days}-day trip plan in ${input.destination} for ${input.people} people. Interests: ${input.interests || "local food and sightseeing"}. The total budget ceiling is ${input.budget}. Return only JSON with keys destination,budget,allocation,itinerary,hotelSuggestions,activitySuggestions,foodSuggestions,estimatedTotalCost,remainingBudget. Never exceed the budget. Each itinerary item has day,title,activities,estimatedCost.`,
      }],
    }),
  });
  if (!response.ok) throw new Error(`AI provider returned HTTP ${response.status}`);
  const result = await response.json();
  const text = (result.content || []).map((part) => part.text || "").join("").replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}
