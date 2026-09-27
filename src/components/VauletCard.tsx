import Link from "next/link";
import { formatMoney } from "./BalanceCard";

export function VauletCard({
  id,
  name,
  memberCount,
  budget,
  balance,
  currency,
}: {
  id: string;
  name: string;
  memberCount: number;
  budget: number | null;
  balance: number;
  currency: string;
}) {
  return (
    <Link
      href={`/vaulets/${id}`}
      className="block bg-white border border-line rounded-xl p-5 hover:border-accent/50 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-ink">{name}</h3>
          <p className="text-sm text-muted mt-0.5">
            {memberCount} member{memberCount === 1 ? "" : "s"}
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-accentSoft text-accent font-medium">{currency}</span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-muted">Balance</p>
          <p className="text-xl font-semibold text-ink">{formatMoney(balance, currency)}</p>
        </div>
        {budget != null && (
          <div className="text-right">
            <p className="text-xs text-muted">Budget</p>
            <p className="text-sm font-medium text-ink/80">{formatMoney(budget, currency)}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
