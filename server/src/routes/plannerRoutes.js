import { Router } from "express";
import { z } from "zod";
import { createPlan } from "../controllers/plannerController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { plannerRateLimit } from "../middleware/plannerRateLimit.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const plannerSchema = z.object({
  destination: z.string().trim().min(1).max(100),
  people: z.coerce.number().int().positive().max(50),
  days: z.coerce.number().int().positive().max(30),
  budget: z.coerce.number().positive().max(1_000_000_000)
    .refine((amount) => {
      const cents = amount * 100;
      const roundedCents = Math.round(cents);
      return roundedCents > 0 && Number.isSafeInteger(roundedCents) && Math.abs(cents - roundedCents) < 1e-7;
    }, "Budget must be at least 0.01 and use no more than two decimal places."),
  interests: z.string().max(300).optional().default(""),
});

router.post("/", requireAuth, validate(plannerSchema), plannerRateLimit, asyncHandler(createPlan));
export default router;
