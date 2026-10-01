import User from "../models/User.js";
import VauletMember from "../models/VauletMember.js";
import { addVauletMember } from "../services/vauletService.js";
import { HttpError } from "../utils/HttpError.js";

export async function listMembers(req, res) {
  const members = await VauletMember.find({ vaulet: req.params.id })
    .sort({ joinedAt: 1 })
    .populate("user", "name email avatar");
  res.json({ data: { members } });
}

export async function addMember(req, res) {
  const email = req.validated.email.toLowerCase();
  const user = await User.findOne({ email }).select("name email avatar");
  if (!user) throw new HttpError(404, "No account found with that email. Ask them to sign up first.");

  const existing = await VauletMember.findOne({ vaulet: req.params.id, user: user.id });
  if (existing) throw new HttpError(409, "That person is already a member.");

  let membership;
  try {
    membership = await addVauletMember(req.params.id, user.id);
  } catch (error) {
    if (error.code === 11000) throw new HttpError(409, "That person is already a member.");
    throw error;
  }
  res.status(201).json({ data: { member: membership } });
}
