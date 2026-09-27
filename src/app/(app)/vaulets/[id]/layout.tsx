import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ensureMember, getVauletWithTotals } from "@/lib/vaulet";
import { formatMoney } from "@/components/BalanceCard";

const TABS = [
  { href: "", label: "Overview" },
  { href: "/wallet", label: "Wallet" },
  { href: "/transactions", label: "Transactions" },
  { href: "/memories", label: "Memories" },
  { href: "/members", label: "Members" },
];

export default async function VauletLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const user = await requireUser();

  try {
    await ensureMember(params.id, user.id);
  } catch {
    redirect("/vaulets");
  }

  const vaulet = await getVauletWithTotals(params.id);
  if (!vaulet) notFound();

  return (
    <div className="space-y-6">
      <div className="bg-white border border-line rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">{vaulet.name}</p>
            <p className="text-4xl font-semibold text-ink mt-1">{formatMoney(vaulet.totals.balance, vaulet.currency)}</p>
            <p className="text-sm text-muted mt-1">Available balance</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/vaulets/${vaulet.id}/wallet`}
              className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              + Add Money
            </Link>
            <Link
              href={`/vaulets/${vaulet.id}/wallet`}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-black/5"
            >
              + Add Expense
            </Link>
          </div>
        </div>
        {vaulet.budget != null && (
          <div className="mt-4 flex gap-6 text-sm text-muted">
            <span>{formatMoney(vaulet.budget, vaulet.currency)} Budget</span>
            <span>{formatMoney(vaulet.totals.spent, vaulet.currency)} Spent</span>
            <span>{vaulet.members.length} Members</span>
          </div>
        )}
      </div>

      <nav className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.label}
            href={`/vaulets/${vaulet.id}${t.href}`}
            className="px-3 py-2 text-sm font-medium text-ink/70 hover:text-ink border-b-2 border-transparent hover:border-accent transition"
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
