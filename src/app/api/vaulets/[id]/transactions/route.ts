import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ensureMember, CATEGORIES } from "@/lib/vaulet";
import { handleApiError } from "@/lib/api-error";

const createSchema = z.object({
  type: z.enum(["contribution", "expense"]),
  amount: z.number().positive("Amount must be greater than 0"), // never allow negative/zero amounts
  description: z.string().max(500).optional(),
  category: z.enum(CATEGORIES).optional(),
  merchant: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  receiptUrl: z.string().max(2000).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await ensureMember(params.id, user.id);

    const transactions = await prisma.transaction.findMany({
      where: { vauletId: params.id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true } } },
    });
    return NextResponse.json(transactions);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await ensureMember(params.id, user.id); // must belong to this Vaulet to transact in it

    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const { type, amount, description, category, merchant, location, receiptUrl } = parsed.data;

    if (type === "expense") {
      // An expense can't push the Vaulet's balance below zero.
      const existing = await prisma.transaction.findMany({ where: { vauletId: params.id } });
      const contributed = existing.filter((t) => t.type === "contribution").reduce((s, t) => s + t.amount, 0);
      const spent = existing.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      if (spent + amount > contributed) {
        return NextResponse.json({ error: "This expense would exceed the Vaulet's available balance" }, { status: 400 });
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        vauletId: params.id,
        userId: user.id, // never trust a client-supplied user id — always the session user
        type,
        amount,
        description,
        category: type === "expense" ? category : undefined,
        merchant,
        location,
        receiptUrl,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
