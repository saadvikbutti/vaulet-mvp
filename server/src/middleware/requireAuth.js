import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { HttpError } from "../utils/HttpError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const cookieName = process.env.COOKIE_NAME || "vaulet_session";
  const token = req.cookies?.[cookieName];
  if (!token) throw new HttpError(401, "You must be logged in.");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, "Your session has expired. Please log in again.");
  }

  const user = await User.findById(payload.userId).select("name email avatar createdAt +sessionVersion");
  if (!user) throw new HttpError(401, "This account is no longer available.");
  if ((payload.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) {
    throw new HttpError(401, "This session has been signed out. Please log in again.");
  }
  req.user = user;
  next();
});
