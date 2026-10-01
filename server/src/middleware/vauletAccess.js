import VauletMember from "../models/VauletMember.js";
import { HttpError } from "../utils/HttpError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireVauletMember = asyncHandler(async (req, res, next) => {
  const membership = await VauletMember.findOne({ vaulet: req.params.id, user: req.user.id });
  if (!membership) throw new HttpError(403, "You do not have access to this Vaulet.");
  req.membership = membership;
  next();
});

export function requireVauletOwner(req, res, next) {
  if (req.membership?.role !== "owner") {
    return next(new HttpError(403, "Only the Vaulet owner can do that."));
  }
  next();
}
