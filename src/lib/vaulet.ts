import { prisma } from "./prisma";

export const CATEGORIES = [
  "Food",
  "Hotel",
  "Transport",
  "Activities",
  "Shopping",
  "Tickets",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Authorization: throws unless `userId` belongs to `vauletId`. Every route
// that reads or writes a Vaulet's data must call this first — a user must
// never be able to reach another group's data by guessing an id.
export async function ensureMember(vauletId: string, userId: string) {
  const membership = await prisma.vauletMember.findUnique({
    where: { vauletId_userId: { vauletId, userId } },
  });
  if (!membership) {
    const err = new Error("FORBIDDEN");
    err.name = "FORBIDDEN";
    throw err;
  }
  return membership;
}

export async function ensureOwner(vauletId: string, userId: string) {
  const membership = await ensureMember(vauletId, userId);
  if (membership.role !== "owner") {
    const err = new Error("FORBIDDEN");
    err.name = "FORBIDDEN";
    throw err;
  }
  return membership;
}

// The balance is never stored — always derived from the transaction log.
export function computeTotals(transactions: { type: string; amount: number; category?: string | null }[]) {
  let contributed = 0;
  let spent = 0;
  const byCategory: Record<string, number> = {};

  for (const t of transactions) {
    if (t.type === "contribution") {
      contributed += t.amount;
    } else if (t.type === "expense") {
      spent += t.amount;
      const cat = t.category || "Other";
      byCategory[cat] = (byCategory[cat] || 0) + t.amount;
    }
  }

  return {
    contributed,
    spent,
    balance: contributed - spent,
    byCategory,
  };
}

export async function getVauletWithTotals(vauletId: string) {
  const vaulet = await prisma.vaulet.findUnique({
    where: { id: vauletId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      transactions: { orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!vaulet) return null;

  const totals = computeTotals(vaulet.transactions);
  return { ...vaulet, totals };
}
