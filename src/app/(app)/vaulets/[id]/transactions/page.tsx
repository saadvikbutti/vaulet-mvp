import { requireUser } from "@/lib/auth";
import { ensureMember } from "@/lib/vaulet";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/components/BalanceCard";

function dayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return "TODAY";
  if (sameDay(date, yesterday)) return "YESTERDAY";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default async function TransactionsPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  await ensureMember(params.id, user.id);

  const vaulet = await prisma.vaulet.findUnique({ where: { id: params.id } });
  const transactions = await prisma.transaction.findMany({
    where: { vauletId: params.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  if (!vaulet) return null;

  const groups = new Map<string, typeof transactions>();
  for (const t of transactions) {
    const label = dayLabel(t.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(t);
  }

  return (
    <div className="space-y-6">
      {transactions.length === 0 ? (
        <p className="text-sm text-muted">No transactions yet — add a contribution or expense from the Wallet tab.</p>
      ) : (
        Array.from(groups.entries()).map(([label, items]) => (
          <div key={label}>
            <p className="text-xs font-semibold text-muted tracking-wide mb-2">{label}</p>
            <div className="bg-white border border-line rounded-xl divide-y divide-line">
              {items.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {t.user.name} {t.type === "contribution" ? "added" : "spent"} {formatMoney(t.amount, vaulet.currency)}
                    </p>
                    <p className="text-xs text-muted">
                      {t.description || (t.type === "contribution" ? "Wallet contribution" : "Expense")}
                      {t.category ? ` · ${t.category}` : ""}
                      {t.merchant ? ` · ${t.merchant}` : ""}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${t.type === "contribution" ? "text-accent" : "text-ink/70"}`}>
                    {t.type === "contribution" ? "+" : "−"}
                    {formatMoney(t.amount, vaulet.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
