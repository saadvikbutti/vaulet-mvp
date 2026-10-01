import test from "node:test";
import assert from "node:assert/strict";
import { isValidIsoTimestamp } from "./isoTimestamp.js";

test("accepts complete ISO timestamps with real calendar dates", () => {
  assert.equal(isValidIsoTimestamp("2024-02-29T12:30:00Z"), true);
  assert.equal(isValidIsoTimestamp("2025-11-01T12:30:00.123+05:30"), true);
});

test("rejects normalized but impossible dates and invalid clock/offset fields", () => {
  assert.equal(isValidIsoTimestamp("2024-02-31T12:30:00Z"), false);
  assert.equal(isValidIsoTimestamp("2023-02-29T12:30:00Z"), false);
  assert.equal(isValidIsoTimestamp("2025-13-01T12:30:00Z"), false);
  assert.equal(isValidIsoTimestamp("2025-01-01T24:00:00Z"), false);
  assert.equal(isValidIsoTimestamp("2025-01-01T12:30:00+25:00"), false);
  assert.equal(isValidIsoTimestamp("not a date"), false);
});
