import { createTravelPlan } from "../services/plannerService.js";

export async function createPlan(req, res) {
  const plan = await createTravelPlan(req.validated);
  res.json({ data: { plan } });
}
