import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { currentUserController, logInController, logOutController, profileController, signUpController } from "../controllers/authController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { message: "Too many login attempts. Please try again in a few minutes." } },
});
const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  email: z.string().trim().email("Enter a valid email.").max(254),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});
const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email.").max(254),
  password: z.string().min(1, "Password is required.").max(128),
});

router.post("/signup", authLimiter, validate(signupSchema), asyncHandler(signUpController));
router.post("/login", authLimiter, validate(loginSchema), asyncHandler(logInController));
router.post("/logout", asyncHandler(logOutController));
router.get("/me", requireAuth, currentUserController);
router.get("/profile", requireAuth, asyncHandler(profileController));

export default router;
