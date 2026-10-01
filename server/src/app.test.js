import test, { after } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";

process.env.CLIENT_URL = "http://localhost:5173";
const { default: app } = await import("./app.js");
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const apiUrl = `http://127.0.0.1:${server.address().port}/api`;

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("health endpoint returns a simple ready response without requiring a database connection", async () => {
  const response = await fetch(`${apiUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { status: "ok" } });
});

test("unknown API paths use the shared JSON 404 format", async () => {
  const response = await fetch(`${apiUrl}/not-a-route`);
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.match(body.error.message, /No route found/);
});

test("cookie-authenticated writes reject an unconfigured browser origin", async () => {
  const response = await fetch(`${apiUrl}/auth/logout`, {
    method: "POST",
    headers: { Origin: "https://untrusted.example" },
  });
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.match(body.error.message, /not allowed/);
});

test("logout is allowed from the configured client origin", async () => {
  const response = await fetch(`${apiUrl}/auth/logout`, {
    method: "POST",
    headers: { Origin: "http://localhost:5173" },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie") || "", /vaulet_session/);
});

test("session cookie attributes differ safely between local HTTP and production HTTPS", async () => {
  const { sessionCookieOptions } = await import("./utils/cookieOptions.js");
  const originalEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  assert.deepEqual(sessionCookieOptions(), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  process.env.NODE_ENV = "production";
  const productionCookie = sessionCookieOptions();
  assert.equal(productionCookie.httpOnly, true);
  assert.equal(productionCookie.secure, true);
  assert.equal(productionCookie.sameSite, "none");

  if (originalEnvironment === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalEnvironment;
});

test("cookie-authenticated writes also reject a missing Origin", async () => {
  const response = await fetch(`${apiUrl}/auth/logout`, { method: "POST" });
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.match(body.error.message, /origin is required/i);
});

test("unexpected server errors are logged but not disclosed in production", async () => {
  const { errorHandler } = await import("./middleware/errorHandler.js");
  const originalEnvironment = process.env.NODE_ENV;
  const originalConsoleError = console.error;
  let responseBody;
  let statusCode;
  const response = {
    status(status) { statusCode = status; return this; },
    json(body) { responseBody = body; return this; },
  };
  process.env.NODE_ENV = "production";
  console.error = () => {};
  try {
    errorHandler(new Error("database connection string must never be exposed"), {}, response, () => {});
    assert.equal(statusCode, 500);
    assert.equal(responseBody.error.message, "Something went wrong. Please try again later.");
    assert.doesNotMatch(JSON.stringify(responseBody), /connection string/);
  } finally {
    console.error = originalConsoleError;
    if (originalEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnvironment;
  }
});
