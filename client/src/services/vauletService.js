import { request } from "./api.js";

export const vauletService = {
  list: async () => (await request("/vaulets")).vaulets,
  create: async (values) => (await request("/vaulets", { method: "POST", body: JSON.stringify(values) })).vaulet,
  get: async (id) => (await request(`/vaulets/${id}`)).vaulet,
  update: async (id, values) => (await request(`/vaulets/${id}`, { method: "PATCH", body: JSON.stringify(values) })).vaulet,
  remove: (id) => request(`/vaulets/${id}`, { method: "DELETE" }),
  members: async (id) => (await request(`/vaulets/${id}/members`)).members,
  addMember: async (id, email) => (await request(`/vaulets/${id}/members`, { method: "POST", body: JSON.stringify({ email }) })).member,
  transactions: async (id) => (await request(`/vaulets/${id}/transactions`)).transactions,
  addTransaction: async (id, values) => (await request(`/vaulets/${id}/transactions`, { method: "POST", body: JSON.stringify(values) })).transaction,
  memories: async (id) => (await request(`/vaulets/${id}/memories`)).memories,
  addMemory: async (id, values) => {
    const body = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") body.append(key, value);
    });
    return (await request(`/vaulets/${id}/memories`, { method: "POST", body })).memory;
  },
};
