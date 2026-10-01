import mongoose from "mongoose";

const plannerRateLimitBucketSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true, min: 1 },
    expiresAt: { type: Date, required: true },
  },
  { collection: "planner_rate_limits", versionKey: false, timestamps: false }
);

plannerRateLimitBucketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("PlannerRateLimitBucket", plannerRateLimitBucketSchema);
