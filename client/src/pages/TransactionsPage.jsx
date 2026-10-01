import { useOutletContext } from "react-router-dom";
import { EmptyState } from "../components/Feedback.jsx";
import TransactionList from "../components/TransactionList.jsx";
import Panel from "../components/Panel.jsx";
import { formatDate } from "../utils/format.js";

function groupByDay(transactions) {
  const groups = new Map();
  for (const transaction of transactions) {
    const date = new Date(transaction.createdAt);
    const key = Number.isNaN(date.getTime()) ? "Unscheduled" : date.toDateString();
    if (!groups.has(key)) groups.set(key, { label: key === "Unscheduled" ? key : formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), items: [] });
    groups.get(key).items.push(transaction);
  }
  return Array.from(groups.values());
}

export default function TransactionsPage() {
  const { vaulet } = useOutletContext();
  const groups = groupByDay(vaulet.transactions || []);
  if (!groups.length) return <EmptyState title="The wallet is ready" description="Contributions and expenses will appear here, grouped by the day they happened." />;
  return <div className="page-stack transaction-groups">{groups.map((group) => <section key={group.label}><p className="eyebrow group-label">{group.label}</p><Panel><TransactionList transactions={group.items} currency={vaulet.currency} /></Panel></section>)}</div>;
}
