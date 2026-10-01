import { createToken, getUserProfile, logIn, publicUser, revokeUserSessions, signUp } from "../services/authService.js";
import { sessionCookieOptions } from "../utils/cookieOptions.js";

export async function signUpController(req, res) {
  const user = await signUp(req.validated);
  res.cookie(process.env.COOKIE_NAME || "vaulet_session", createToken(user.id), sessionCookieOptions());
  res.status(201).json({ data: { user } });
}

export async function logInController(req, res) {
  const { user, token } = await logIn(req.validated);
  res.cookie(process.env.COOKIE_NAME || "vaulet_session", token, sessionCookieOptions());
  res.json({ data: { user } });
}

export async function logOutController(req, res) {
  const cookieName = process.env.COOKIE_NAME || "vaulet_session";
  let revocationError;
  try {
    await revokeUserSessions(req.cookies?.[cookieName]);
  } catch (error) {
    revocationError = error;
  }
  const { httpOnly, secure, sameSite, path } = sessionCookieOptions();
  res.clearCookie(cookieName, { httpOnly, secure, sameSite, path });
  if (revocationError) throw revocationError;
  res.json({ data: { message: "You have been logged out of all sessions." } });
}

export function currentUserController(req, res) {
  res.json({ data: { user: publicUser(req.user) } });
}

export async function profileController(req, res) {
  res.json({ data: { user: await getUserProfile(req.user) } });
}
