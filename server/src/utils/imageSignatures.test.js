import test from "node:test";
import assert from "node:assert/strict";
import { detectImageMimeType } from "./imageSignatures.js";

test("recognizes supported image signatures", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
  const webp = Buffer.from("RIFF0000WEBP", "ascii");
  const gif = Buffer.from("GIF89a", "ascii");
  assert.equal(detectImageMimeType(png), "image/png");
  assert.equal(detectImageMimeType(jpeg), "image/jpeg");
  assert.equal(detectImageMimeType(webp), "image/webp");
  assert.equal(detectImageMimeType(gif), "image/gif");
});

test("rejects unsupported or falsely labelled file content", () => {
  assert.equal(detectImageMimeType(Buffer.from("image/png")), null);
  assert.equal(detectImageMimeType("not a buffer"), null);
});
