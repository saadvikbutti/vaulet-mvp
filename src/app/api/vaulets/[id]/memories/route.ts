import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ensureMember } from "@/lib/vaulet";
import { handleApiError } from "@/lib/api-error";

const createSchema = z.object({
  imageUrl: z.string().min(1),
  caption: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  takenAt: z.string().optional(), // ISO date string from the client
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await ensureMember(params.id, user.id);

    const memories = await prisma.memory.findMany({
      where: { vauletId: params.id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json(memories);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await ensureMember(params.id, user.id);

    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "A photo is required" }, { status: 400 });
    }
    const { imageUrl, caption, location, takenAt } = parsed.data;

    const memory = await prisma.memory.create({
      data: {
        vauletId: params.id,
        userId: user.id,
        imageUrl,
        caption,
        location,
        takenAt: takenAt ? new Date(takenAt) : undefined,
      },
    });

    return NextResponse.json(memory, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
