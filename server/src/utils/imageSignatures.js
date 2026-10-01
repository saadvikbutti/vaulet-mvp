const IMAGE_SIGNATURES = [
  { mimeType: "image/jpeg", matches: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  { mimeType: "image/png", matches: (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mimeType: "image/gif", matches: (buffer) => buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6)) },
  { mimeType: "image/webp", matches: (buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" },
];

export function detectImageMimeType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  return IMAGE_SIGNATURES.find((signature) => signature.matches(buffer))?.mimeType || null;
}
