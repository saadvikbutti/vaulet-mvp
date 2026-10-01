import test from "node:test";
import assert from "node:assert/strict";
import { getPlannerBucketId, PLANNER_WINDOW_MS } from "./plannerRateLimit.js";

test("planner quota buckets are shared by client IP within a fixed window without storing the raw IP", () => {
  const first = getPlannerBucketId("203.0.113.8", 1_700_000_000_000);
  const repeated = getPlannerBucketId("203.0.113.8", 1_700_000_001_000);
  const otherClient = getPlannerBucketId("203.0.113.9", 1_700_000_000_000);
  const nextWindow = getPlannerBucketId("203.0.113.8", first.windowStart + PLANNER_WINDOW_MS);

  assert.equal(first.id, repeated.id);
  assert.notEqual(first.id, otherClient.id);
  assert.notEqual(first.id, nextWindow.id);
  assert.doesNotMatch(first.id, /203\.0\.113\.8/);
});

test("planner quota model declares a TTL index for its expiry timestamp", async () => {
  const { default: PlannerRateLimitBucket } = await import("../models/PlannerRateLimitBucket.js");
  const ttlIndex = PlannerRateLimitBucket.schema.indexes().find(([fields, options]) => fields.expiresAt === 1 && options.expireAfterSeconds === 0);
  assert.ok(ttlIndex);
});
