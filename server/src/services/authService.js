import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import VauletMember from "../models/VauletMember.js";
import { HttpError } from "../utils/HttpError.js";

const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

export async function signUp({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) throw new HttpError(409, "An account with that email already exists.");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash });
  return publicUser(user);
}

export async function logIn({ email, password }) {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash +sessionVersion");
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !passwordMatches) {
    throw new HttpError(401, "Incorrect email or password.");
  }
  return { user: publicUser(user), token: createToken(user.id, user.sessionVersion ?? 0) };
}

export function createToken(userId, sessionVersion = 0) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters.");
  }
  return jwt.sign({ userId, sessionVersion }, process.env.JWT_SECRET, { expiresIn: TOKEN_LIFETIME_SECONDS });
}

export async function revokeUserSessions(token) {
  if (!token) return;
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters.");
  }
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) return;
    throw error;
  }
  if (!payload?.userId) return;
  const sessionVersion = Number.isInteger(payload.sessionVersion) ? payload.sessionVersion : 0;
  // `null` also matches older MongoDB user records where the field is absent.
  await User.updateOne(
    { _id: payload.userId, sessionVersion: { $in: [sessionVersion, null] } },
    { $inc: { sessionVersion: 1 } }
  );
}

export async function getUserProfile(user) {
  const vauletCount = await VauletMember.countDocuments({ user: user.id });
  return { ...publicUser(user), vauletCount };
}

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || "",
    createdAt: user.createdAt,
  };
}
