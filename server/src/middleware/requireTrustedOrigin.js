import { HttpError } from "../utils/HttpError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function requireTrustedOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const requestOrigin = req.get("origin");
  if (!requestOrigin) return next(new HttpError(403, "A trusted website origin is required to make changes."));
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((item) => item.trim()).filter(Boolean);
  if (!allowedOrigins.includes(requestOrigin)) {
    return next(new HttpError(403, "This website is not allowed to make changes to your Vaulet."));
  }
  next();
}
