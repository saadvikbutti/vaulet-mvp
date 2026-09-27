import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTotals } from "@/lib/vaulet";
import { VauletCard } from "@/components/VauletCard";

export default async function VauletsPage() {
  const user = await requireUser();

  const memberships = await prisma.vauletMember.findMany({
    where: { userId: user.id },
    include: { vaulet: { include: { members: true, transactions: true } } },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Vaulets</h1>
        <Link href="/vaulets/new" className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-medium hover:opacity-90">
          + New Vaulet
        </Link>
      </div>

      {memberships.length === 0 ? (
        <div className="bg-white border border-dashed border-line rounded-xl p-8 text-center">
          <p className="text-muted mb-4">No Vaulets yet.</p>
          <Link href="/vaulets/new" className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-medium">
            Create your first Vaulet
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {memberships.map((m) => {
            const totals = computeTotals(m.vaulet.transactions);
            return (
              <VauletCard
                key={m.vaulet.id}
                id={m.vaulet.id}
                name={m.vaulet.name}
                memberCount={m.vaulet.members.length}
                budget={m.vaulet.budget}
                balance={totals.balance}
                currency={m.vaulet.currency}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
