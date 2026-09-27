import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  currency: z.string().min(1).max(10).default("INR"),
  budget: z.number().positive().optional().nullable(),
});

export async function GET() {
  const user = await requireUser();
  const memberships = await prisma.vauletMember.findMany({
    where: { userId: user.id },
    include: { vaulet: true },
  });
  return NextResponse.json(memberships.map((m) => m.vaulet));
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, description, currency, budget } = parsed.data;

  const vaulet = await prisma.vaulet.create({
    data: {
      name,
      description,
      currency,
      budget: budget ?? null,
      createdById: user.id,
      members: { create: { userId: user.id, role: "owner" } },
    },
  });

  return NextResponse.json(vaulet, { status: 201 });
}
