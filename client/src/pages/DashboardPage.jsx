import { Link } from "react-router-dom";
import { useLoad } from "../hooks/useLoad.js";
import { vauletService } from "../services/vauletService.js";
import { formatMoney, getId } from "../utils/format.js";
import VauletCard from "../components/VauletCard.jsx";
import StatCard from "../components/StatCard.jsx";
import TransactionList from "../components/TransactionList.jsx";
import Panel from "../components/Panel.jsx";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../components/Feedback.jsx";

function totalsByCurrency(vaulets) {
  const totals = new Map();
  for (const vaulet of vaulets) {
    const currency = vaulet.currency || "INR";
    totals.set(currency, (totals.get(currency) || 0) + (vaulet.totals?.balance || 0));
  }
  return Array.from(totals, ([currency, amount]) => formatMoney(amount, currency)).join(" · ") || formatMoney(0);
}

export default function DashboardPage() {
  const { data: vaulets = [], loading, error, refresh } = useLoad(vauletService.list, []);
  if (loading) return <LoadingState label="Gathering your wallets…" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const memberCount = vaulets.reduce((sum, item) => sum + (item.memberCount || 0), 0);
  const activity = vaulets.flatMap((item) => (item.recentTransactions || []).map((transaction) => ({ ...transaction, vauletName: item.name, currency: item.currency })))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)).slice(0, 8);

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Your group money, at a glance" title="Dashboard" description="See what’s in motion across your shared wallets." action={<Link className="button button-primary" to="/vaulets/new">New Vaulet <span>↗</span></Link>} />
      <section className="stats-grid stats-grid-four">
        <StatCard label="Wallets combined" value={totalsByCurrency(vaulets)} note="Grouped by currency" accent />
        <StatCard label="Your Vaulets" value={String(vaulets.length).padStart(2, "0")} note="Shared with your group" />
        <StatCard label="Member seats" value={String(memberCount).padStart(2, "0")} note="Across your wallets" />
        <StatCard label="Recent activity" value={String(activity.length).padStart(2, "0")} note="Latest transactions" />
      </section>
      <section className="content-section">
        <div className="section-heading"><div><p className="eyebrow">The things you’re planning</p><h2>Your Vaulets</h2></div><Link className="text-link" to="/vaulets">All Vaulets <span>→</span></Link></div>
        {vaulets.length ? <div className="vault-grid">{vaulets.slice(0, 4).map((vaulet) => <VauletCard key={getId(vaulet)} vaulet={vaulet} />)}</div> : <EmptyState title="Start with a shared plan" description="Create your first Vaulet to collect contributions, keep spending in view, and save the moments along the way." action={<Link className="button button-primary" to="/vaulets/new">Create your first Vaulet <span>↗</span></Link>} />}
      </section>
      {activity.length > 0 && <Panel title="Recent activity" action={<span className="panel-caption">Across your wallets</span>}><TransactionList transactions={activity} showWallet /></Panel>}
    </div>
  );
}
