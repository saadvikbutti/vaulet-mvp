import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ensureMember, getVauletWithTotals } from "@/lib/vaulet";
import { handleApiError } from "@/lib/api-error";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await ensureMember(params.id, user.id); // throws FORBIDDEN if not a member

    const vaulet = await getVauletWithTotals(params.id);
    if (!vaulet) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(vaulet);
  } catch (err) {
    return handleApiError(err);
  }
}
