import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ensureMember } from "@/lib/vaulet";
import { handleApiError } from "@/lib/api-error";

const addSchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await ensureMember(params.id, user.id); // any existing member can add others, per spec's simple invite flow

    const body = await req.json().catch(() => null);
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!target) {
      return NextResponse.json({ error: "No account found with that email — ask them to sign up first" }, { status: 404 });
    }

    const existing = await prisma.vauletMember.findUnique({
      where: { vauletId_userId: { vauletId: params.id, userId: target.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "That person is already a member" }, { status: 409 });
    }

    const member = await prisma.vauletMember.create({
      data: { vauletId: params.id, userId: target.id, role: "member" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
