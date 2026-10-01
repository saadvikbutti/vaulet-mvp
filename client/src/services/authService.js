import { request } from "./api.js";

export const authService = {
  signUp: (values) => request("/auth/signup", { method: "POST", body: JSON.stringify(values) }),
  logIn: (values) => request("/auth/login", { method: "POST", body: JSON.stringify(values) }),
  logOut: () => request("/auth/logout", { method: "POST" }),
  currentUser: () => request("/auth/me"),
};
