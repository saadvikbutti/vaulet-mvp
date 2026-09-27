import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ensureMember, getVauletWithTotals } from "@/lib/vaulet";
import { StatCard, formatMoney } from "@/components/BalanceCard";

export default async function VauletOverviewPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  await ensureMember(params.id, user.id);

  const vaulet = await getVauletWithTotals(params.id);
  if (!vaulet) return null;

  const categoryEntries = Object.entries(vaulet.totals.byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(1, ...categoryEntries.map(([, v]) => v));

  return (
    <div className="space-y-8">
      {vaulet.description && <p className="text-ink/80">{vaulet.description}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Budget" value={vaulet.budget != null ? formatMoney(vaulet.budget, vaulet.currency) : "—"} />
        <StatCard label="Contributed" value={formatMoney(vaulet.totals.contributed, vaulet.currency)} />
        <StatCard label="Spent" value={formatMoney(vaulet.totals.spent, vaulet.currency)} />
        <StatCard
          label="Remaining budget"
          value={vaulet.budget != null ? formatMoney(vaulet.budget - vaulet.totals.spent, vaulet.currency) : "—"}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Spending by category</h2>
          {categoryEntries.length === 0 ? (
            <p className="text-sm text-muted">No expenses recorded yet.</p>
          ) : (
            <div className="bg-white border border-line rounded-xl p-4 space-y-3">
              {categoryEntries.map(([cat, amount]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-ink/80">{cat}</span>
                    <span className="text-muted">{formatMoney(amount, vaulet.currency)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-line overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(amount / maxCategory) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Recent transactions</h2>
          {vaulet.transactions.length === 0 ? (
            <p className="text-sm text-muted">No transactions yet.</p>
          ) : (
            <div className="bg-white border border-line rounded-xl divide-y divide-line">
              {vaulet.transactions.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{t.user.name}</p>
                    <p className="text-xs text-muted">{t.description || t.category || (t.type === "contribution" ? "Wallet contribution" : "Expense")}</p>
                  </div>
                  <span className={`text-sm font-medium ${t.type === "contribution" ? "text-accent" : "text-ink/70"}`}>
                    {t.type === "contribution" ? "+" : "−"}
                    {formatMoney(t.amount, vaulet.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link href={`/vaulets/${vaulet.id}/transactions`} className="text-sm text-accent font-medium mt-2 inline-block">
            View all →
          </Link>
        </div>
      </div>
    </div>
  );
}
