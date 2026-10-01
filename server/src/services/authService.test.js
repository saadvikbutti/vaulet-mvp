import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { createToken, revokeUserSessions } from "./authService.js";

const TEST_SECRET = "test-only-session-secret-with-at-least-32-chars";
const TEST_USER_ID = "65a0b2c4d6e8f01234567890";

async function withTestSecret(callback) {
  const originalSecret = process.env.JWT_SECRET;
  const originalUpdateOne = User.updateOne;
  process.env.JWT_SECRET = TEST_SECRET;
  try {
    await callback();
  } finally {
    User.updateOne = originalUpdateOne;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
}

test("new JWTs carry the account session version", async () => {
  await withTestSecret(async () => {
    const payload = jwt.verify(createToken(TEST_USER_ID, 3), TEST_SECRET);
    assert.equal(payload.userId, TEST_USER_ID);
    assert.equal(payload.sessionVersion, 3);
  });
});

test("logout increments only the version encoded in the current token", async () => {
  await withTestSecret(async () => {
    let receivedFilter;
    let receivedUpdate;
    User.updateOne = async (filter, update) => {
      receivedFilter = filter;
      receivedUpdate = update;
      return { modifiedCount: 1 };
    };

    await revokeUserSessions(createToken(TEST_USER_ID, 4));
    assert.deepEqual(receivedFilter, { _id: TEST_USER_ID, sessionVersion: { $in: [4, null] } });
    assert.deepEqual(receivedUpdate, { $inc: { sessionVersion: 1 } });
  });
});

test("logout treats pre-version JWTs as version zero and ignores an invalid token", async () => {
  await withTestSecret(async () => {
    const filters = [];
    User.updateOne = async (filter) => {
      filters.push(filter);
      return { modifiedCount: 1 };
    };

    const legacyToken = jwt.sign({ userId: TEST_USER_ID }, TEST_SECRET, { expiresIn: 60 });
    await revokeUserSessions(legacyToken);
    await revokeUserSessions("not-a-jwt");
    assert.equal(filters.length, 1);
    assert.deepEqual(filters[0].sessionVersion, { $in: [0, null] });
  });
});
