import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { generatePlan } from "@/lib/planner";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({
  destination: z.string().min(1).max(100),
  people: z.number().int().positive().max(50),
  days: z.number().int().positive().max(30),
  budget: z.number().positive(),
  interests: z.string().max(300).optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const plan = await generatePlan(parsed.data);
    return NextResponse.json(plan);
  } catch (err) {
    return handleApiError(err);
  }
}
