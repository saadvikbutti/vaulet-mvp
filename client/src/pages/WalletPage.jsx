import { useOutletContext } from "react-router-dom";
import { formatMoney, getId } from "../utils/format.js";
import TransactionForm from "../components/TransactionForm.jsx";
import Panel from "../components/Panel.jsx";
import TransactionList from "../components/TransactionList.jsx";

export default function WalletPage() {
  const { vaulet, refreshVaulet } = useOutletContext();
  const totals = vaulet.totals || { contributed: 0, spent: 0, balance: 0 };
  const members = vaulet.members || [];

  async function refreshAll() {
    await refreshVaulet();
  }

  return (
    <div className="page-stack">
      <section className="wallet-summary panel">
        <div><p className="eyebrow">Available balance</p><strong className="wallet-balance">{formatMoney(totals.balance, vaulet.currency)}</strong><p className="muted-copy">Always calculated from contributions minus expenses.</p></div>
        <div className="wallet-split"><div><span className="metric-label">Contributed</span><strong>{formatMoney(totals.contributed, vaulet.currency)}</strong></div><div><span className="metric-label">Spent</span><strong>{formatMoney(totals.spent, vaulet.currency)}</strong></div></div>
      </section>
      <div className="two-column-layout wallet-layout">
        <Panel title="Contributions by member" action={<span className="panel-caption">Total added</span>}>
          {members.length ? <div className="member-contribution-list">{members.map((membership) => {
            const userId = getId(membership.user);
            const contributed = (vaulet.transactions || []).filter((item) => getId(item.user) === userId && item.type === "contribution").reduce((sum, item) => sum + item.amount, 0);
            return <div className="member-contribution" key={getId(membership)}><span className="member-avatar">{membership.user?.name?.slice(0, 1)?.toUpperCase() || "V"}</span><span className="member-name">{membership.user?.name || "Member"}</span><strong>{formatMoney(contributed, vaulet.currency)}</strong></div>;
          })}</div> : <p className="muted-copy">No members found.</p>}
        </Panel>
        <div className="form-column"><TransactionForm vauletId={getId(vaulet)} type="contribution" currency={vaulet.currency} onSaved={refreshAll} /><TransactionForm vauletId={getId(vaulet)} type="expense" currency={vaulet.currency} onSaved={refreshAll} /></div>
      </div>
      <Panel title="Latest movement"><TransactionList transactions={(vaulet.transactions || []).slice(0, 6)} currency={vaulet.currency} /></Panel>
    </div>
  );
}
