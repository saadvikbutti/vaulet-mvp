import { request } from "./api.js";

export const plannerService = {
  create: async (values) => (await request("/planner", { method: "POST", body: JSON.stringify(values) })).plan,
};
