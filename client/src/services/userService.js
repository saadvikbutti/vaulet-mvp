import { request } from "./api.js";

export const userService = {
  profile: async () => (await request("/users/me")).user,
};
