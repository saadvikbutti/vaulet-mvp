import { getUserProfile } from "../services/authService.js";

export async function getMyProfile(req, res) {
  res.json({ data: { user: await getUserProfile(req.user) } });
}
