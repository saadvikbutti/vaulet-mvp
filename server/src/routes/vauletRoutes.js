import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { addMember, listMembers } from "../controllers/membersController.js";
import { listMemories, uploadMemory } from "../controllers/memoriesController.js";
import { createTransaction, listTransactions } from "../controllers/transactionsController.js";
import { createVauletController, deleteVauletController, getVauletController, listVaulets, updateVauletController } from "../controllers/vauletsController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireVauletMember, requireVauletOwner } from "../middleware/vauletAccess.js";
import { validate } from "../middleware/validate.js";
import { TRANSACTION_CATEGORIES } from "../models/Transaction.js";
import { VAULET_CURRENCIES } from "../models/Vaulet.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const MAX_MONEY_AMOUNT = 1_000_000_000;
const moneyAmountSchema = z.number().positive("Amount must be greater than zero.")
  .max(MAX_MONEY_AMOUNT, `Amount cannot exceed ${MAX_MONEY_AMOUNT}.`)
  .refine((amount) => {
    const cents = amount * 100;
    const roundedCents = Math.round(cents);
    return roundedCents > 0 && Number.isSafeInteger(roundedCents) && Math.abs(cents - roundedCents) < 1e-7;
  }, "Amount must be at least 0.01 and use no more than two decimal places.");
const createVauletSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional().default(""),
  currency: z.string().trim().toUpperCase().pipe(z.enum(VAULET_CURRENCIES)).default("INR"),
  budget: moneyAmountSchema.nullable().optional().default(null),
});
const updateVauletSchema = createVauletSchema.partial().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");
const memberSchema = z.object({ email: z.string().trim().email().max(254) });
const transactionSchema = z.object({
  type: z.enum(["contribution", "expense"]),
  amount: moneyAmountSchema,
  description: z.string().trim().max(500).optional().default(""),
  category: z.enum(TRANSACTION_CATEGORIES).optional(),
  merchant: z.string().trim().max(200).optional().default(""),
  location: z.string().trim().max(200).optional().default(""),
  receiptUrl: z.string().trim().max(2000).optional().default("").refine((value) => {
    if (!value) return true;
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  }, "Receipt URL must use HTTPS."),
});

router.get("/", requireAuth, asyncHandler(listVaulets));
router.post("/", requireAuth, validate(createVauletSchema), asyncHandler(createVauletController));
router.route("/:id")
  .all(requireAuth, requireVauletMember)
  .get(asyncHandler(getVauletController))
  .patch(requireVauletOwner, validate(updateVauletSchema), asyncHandler(updateVauletController))
  .delete(requireVauletOwner, asyncHandler(deleteVauletController));

router.get("/:id/members", requireAuth, requireVauletMember, asyncHandler(listMembers));
router.post("/:id/members", requireAuth, requireVauletMember, validate(memberSchema), asyncHandler(addMember));
router.get("/:id/transactions", requireAuth, requireVauletMember, asyncHandler(listTransactions));
router.post("/:id/transactions", requireAuth, requireVauletMember, validate(transactionSchema), asyncHandler(createTransaction));
router.get("/:id/memories", requireAuth, requireVauletMember, asyncHandler(listMemories));
router.post("/:id/memories", requireAuth, requireVauletMember, imageUpload.single("file"), asyncHandler(uploadMemory));

export default router;
