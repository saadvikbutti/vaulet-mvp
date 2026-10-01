import mongoose from "mongoose";

export const TRANSACTION_CATEGORIES = ["Food", "Hotel", "Transport", "Activities", "Shopping", "Tickets", "Other"];

const transactionSchema = new mongoose.Schema(
  {
    vaulet: { type: mongoose.Schema.Types.ObjectId, ref: "Vaulet", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["contribution", "expense"], required: true },
    amount: { type: Number, required: true, min: 0.01, max: 1_000_000_000 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    category: { type: String, enum: TRANSACTION_CATEGORIES, default: null },
    merchant: { type: String, trim: true, maxlength: 200, default: "" },
    location: { type: String, trim: true, maxlength: 200, default: "" },
    receiptUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
      validate: { validator: (value) => !value || value.startsWith("https://"), message: "Receipt URLs must use HTTPS." },
    },
  },
  { timestamps: true }
);

transactionSchema.index({ vaulet: 1, createdAt: -1 });
export default mongoose.model("Transaction", transactionSchema);
