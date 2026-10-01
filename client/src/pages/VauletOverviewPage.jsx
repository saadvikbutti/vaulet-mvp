import { Link, useOutletContext } from "react-router-dom";
import { formatMoney } from "../utils/format.js";
import StatCard from "../components/StatCard.jsx";
import Panel from "../components/Panel.jsx";
import TransactionList from "../components/TransactionList.jsx";

export default function VauletOverviewPage() {
  const { vaulet } = useOutletContext();
  const totals = vaulet.totals || { contributed: 0, spent: 0, balance: 0, byCategory: {} };
  const categoryEntries = Object.entries(totals.byCategory || {}).sort((a, b) => b[1] - a[1]);
  const largestCategory = Math.max(1, ...categoryEntries.map(([, amount]) => amount));
  const remainingBudget = vaulet.budget == null ? null : Math.max(0, vaulet.budget - totals.spent);

  return (
    <div className="page-stack">
      <section className="stats-grid stats-grid-four">
        <StatCard label="Target budget" value={vaulet.budget == null ? "Not set" : formatMoney(vaulet.budget, vaulet.currency)} />
        <StatCard label="Total contributed" value={formatMoney(totals.contributed, vaulet.currency)} accent />
        <StatCard label="Total spent" value={formatMoney(totals.spent, vaulet.currency)} />
        <StatCard label="Budget remaining" value={remainingBudget == null ? "—" : formatMoney(remainingBudget, vaulet.currency)} />
      </section>
      {vaulet.budget != null && <div className="budget-track" aria-label="Budget spent"><span style={{ width: `${Math.min(100, (totals.spent / Math.max(vaulet.budget, 1)) * 100)}%` }} /></div>}
      <div className="two-column-layout">
        <Panel title="Spending by category" action={<span className="panel-caption">From logged expenses</span>}>
          {categoryEntries.length ? <div className="category-list">{categoryEntries.map(([category, amount]) => <div className="category-row" key={category}><div className="category-label"><span>{category}</span><strong>{formatMoney(amount, vaulet.currency)}</strong></div><div className="category-track"><span style={{ width: `${(amount / largestCategory) * 100}%` }} /></div></div>)}</div> : <p className="muted-copy">No expenses recorded yet. Spending will appear here once your group starts logging it.</p>}
        </Panel>
        <Panel title="Recent transactions" action={<Link className="text-link" to="transactions">See all <span>→</span></Link>}>
          <TransactionList transactions={(vaulet.transactions || []).slice(0, 5)} currency={vaulet.currency} />
        </Panel>
      </div>
      <div className="overview-actions"><Link className="button button-secondary" to="members">Meet the group <span>↗</span></Link><Link className="button button-primary" to="wallet">Open the wallet <span>↗</span></Link></div>
    </div>
  );
}
