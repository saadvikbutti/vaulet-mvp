import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    vaulet: { type: mongoose.Schema.Types.ObjectId, ref: "Vaulet", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true, maxlength: 2000 },
    storagePublicId: { type: String, required: true, maxlength: 300 },
    caption: { type: String, trim: true, maxlength: 500, default: "" },
    location: { type: String, trim: true, maxlength: 200, default: "" },
    takenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

memorySchema.index({ vaulet: 1, createdAt: -1 });
export default mongoose.model("Memory", memorySchema);
