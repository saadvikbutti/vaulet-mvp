import { Router } from "express";
import { getMyProfile } from "../controllers/usersController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get("/me", requireAuth, asyncHandler(getMyProfile));
export default router;
