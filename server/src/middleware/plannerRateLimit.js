import { createHash } from "node:crypto";
import PlannerRateLimitBucket from "../models/PlannerRateLimitBucket.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const PLANNER_LIMIT = 20;
export const PLANNER_WINDOW_MS = 60 * 60 * 1000;

export function getPlannerBucketId(clientIp, now = Date.now()) {
  const windowStart = Math.floor(now / PLANNER_WINDOW_MS) * PLANNER_WINDOW_MS;
  const addressHash = createHash("sha256").update(clientIp || "unknown").digest("hex");
  return { id: `${windowStart}:${addressHash}`, windowStart };
}

async function incrementBucket(id, expiresAt) {
  try {
    return await PlannerRateLimitBucket.findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, new: true }
    ).lean().exec();
  } catch (error) {
    // Two first requests can race to upsert the same _id; the loser retries as an update.
    if (error.code !== 11000) throw error;
    const bucket = await PlannerRateLimitBucket.findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 } },
      { new: true }
    ).lean().exec();
    if (!bucket) throw error;
    return bucket;
  }
}

export const plannerRateLimit = asyncHandler(async (req, res, next) => {
  const now = Date.now();
  const { id, windowStart } = getPlannerBucketId(req.ip || req.socket.remoteAddress, now);
  // Keep expired windows briefly so MongoDB's asynchronous TTL monitor can clean them safely.
  const expiresAt = new Date(windowStart + PLANNER_WINDOW_MS + 5 * 60 * 1000);
  const bucket = await incrementBucket(id, expiresAt);
  const resetSeconds = Math.max(0, Math.ceil((windowStart + PLANNER_WINDOW_MS - now) / 1000));
  const remaining = Math.max(0, PLANNER_LIMIT - bucket.count);

  res.set("RateLimit-Policy", `${PLANNER_LIMIT};w=${PLANNER_WINDOW_MS / 1000}`);
  res.set("RateLimit-Limit", String(PLANNER_LIMIT));
  res.set("RateLimit-Remaining", String(remaining));
  res.set("RateLimit-Reset", String(resetSeconds));

  if (bucket.count > PLANNER_LIMIT) {
    res.set("Retry-After", String(Math.max(1, resetSeconds)));
    return res.status(429).json({ error: { message: "The planner has reached its hourly limit. Please try again later." } });
  }
  next();
});
