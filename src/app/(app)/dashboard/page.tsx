import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTotals } from "@/lib/vaulet";
import { StatCard, formatMoney } from "@/components/BalanceCard";
import { VauletCard } from "@/components/VauletCard";

export default async function DashboardPage() {
  const user = await requireUser();

  const memberships = await prisma.vauletMember.findMany({
    where: { userId: user.id },
    include: {
      vaulet: {
        include: {
          members: true,
          transactions: { orderBy: { createdAt: "desc" }, take: 5, include: { user: { select: { name: true } } } },
        },
      },
    },
  });

  const vaultsWithTotals = memberships.map((m) => ({
    ...m.vaulet,
    totals: computeTotals(m.vaulet.transactions),
  }));

  const grandBalance = vaultsWithTotals.reduce((s, v) => s + v.totals.balance, 0);
  const grandContributed = vaultsWithTotals.reduce((s, v) => s + v.totals.contributed, 0);
  const grandSpent = vaultsWithTotals.reduce((s, v) => s + v.totals.spent, 0);

  const recentTransactions = vaultsWithTotals
    .flatMap((v) => v.transactions.map((t) => ({ ...t, vauletName: v.name, currency: v.currency })))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link href="/vaulets/new" className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-medium hover:opacity-90">
          + New Vaulet
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total balance" value={formatMoney(grandBalance)} />
        <StatCard label="Total contributed" value={formatMoney(grandContributed)} />
        <StatCard label="Total spent" value={formatMoney(grandSpent)} />
        <StatCard label="Vaulets" value={String(vaultsWithTotals.length)} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Your Vaulets</h2>
        {vaultsWithTotals.length === 0 ? (
          <div className="bg-white border border-dashed border-line rounded-xl p-8 text-center">
            <p className="text-muted mb-4">You haven&apos;t created a Vaulet yet.</p>
            <Link href="/vaulets/new" className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-medium">
              Create your first Vaulet
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {vaultsWithTotals.map((v) => (
              <VauletCard
                key={v.id}
                id={v.id}
                name={v.name}
                memberCount={v.members.length}
                budget={v.budget}
                balance={v.totals.balance}
                currency={v.currency}
              />
            ))}
          </div>
        )}
      </div>

      {recentTransactions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent activity</h2>
          <div className="bg-white border border-line rounded-xl divide-y divide-line">
            {recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {t.user.name} {t.type === "contribution" ? "added" : "spent"} {formatMoney(t.amount, t.currency)}
                  </p>
                  <p className="text-xs text-muted">
                    {t.vauletName}
                    {t.description ? ` · ${t.description}` : ""}
                  </p>
                </div>
                <span className={`text-xs font-medium ${t.type === "contribution" ? "text-accent" : "text-ink/60"}`}>
                  {t.type === "contribution" ? "+" : "−"}
                  {formatMoney(t.amount, t.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
