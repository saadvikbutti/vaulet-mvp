import mongoose from "mongoose";

export const VAULET_CURRENCIES = ["INR", "USD", "EUR", "GBP", "CAD", "AUD", "NZD", "SGD", "AED", "JPY", "CNY", "CHF"];

const vauletSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    currency: { type: String, required: true, uppercase: true, enum: VAULET_CURRENCIES, default: "INR" },
    budget: { type: Number, min: 0.01, max: 1_000_000_000, default: null },
    // Not a stored balance: touching this value serializes concurrent ledger transactions.
    ledgerVersion: { type: Number, default: 0, min: 0, select: false },
    deleting: { type: Boolean, default: false, select: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Vaulet", vauletSchema);
