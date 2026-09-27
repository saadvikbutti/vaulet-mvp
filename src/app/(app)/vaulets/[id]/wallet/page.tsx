import { requireUser } from "@/lib/auth";
import { ensureMember, getVauletWithTotals } from "@/lib/vaulet";
import { formatMoney } from "@/components/BalanceCard";
import { TransactionForm } from "@/components/TransactionForm";

export default async function WalletPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  await ensureMember(params.id, user.id);

  const vaulet = await getVauletWithTotals(params.id);
  if (!vaulet) return null;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="bg-white border border-line rounded-xl p-5">
          <p className="text-sm text-muted">Available balance</p>
          <p className="text-3xl font-semibold">{formatMoney(vaulet.totals.balance, vaulet.currency)}</p>
          <div className="flex gap-6 mt-3 text-sm text-muted">
            <span>Contributed: {formatMoney(vaulet.totals.contributed, vaulet.currency)}</span>
            <span>Spent: {formatMoney(vaulet.totals.spent, vaulet.currency)}</span>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Contributors</h3>
          <div className="bg-white border border-line rounded-xl divide-y divide-line">
            {vaulet.members.map((m) => {
              const contributed = vaulet.transactions
                .filter((t) => t.userId === m.userId && t.type === "contribution")
                .reduce((s, t) => s + t.amount, 0);
              return (
                <div key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>{m.user.name}</span>
                  <span className="font-medium">{formatMoney(contributed, vaulet.currency)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <TransactionForm vauletId={vaulet.id} type="contribution" />
        <TransactionForm vauletId={vaulet.id} type="expense" />
      </div>
    </div>
  );
}
