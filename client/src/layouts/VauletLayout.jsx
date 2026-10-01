import { NavLink, Outlet, useParams } from "react-router-dom";
import { useLoad } from "../hooks/useLoad.js";
import { vauletService } from "../services/vauletService.js";
import { formatMoney } from "../utils/format.js";
import { ErrorState, LoadingState } from "../components/Feedback.jsx";

const tabs = [
  { suffix: "", label: "Overview" },
  { suffix: "/wallet", label: "Wallet" },
  { suffix: "/transactions", label: "Transactions" },
  { suffix: "/memories", label: "Memories" },
  { suffix: "/members", label: "Members" },
];

export default function VauletLayout() {
  const { id } = useParams();
  const { data: vaulet, loading, error, refresh } = useLoad(() => vauletService.get(id), [id]);
  if (loading) return <LoadingState label="Opening your Vaulet…" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!vaulet) return null;
  const root = `/vaulets/${id}`;

  return (
    <div className="vaulet-workspace">
      <section className="vaulet-banner">
        <div className="banner-topline"><span className="eyebrow">Your shared wallet</span><span className="currency-pill">{vaulet.currency}</span></div>
        <div className="banner-main">
          <div><h1>{vaulet.name}</h1>{vaulet.description && <p>{vaulet.description}</p>}</div>
          <div className="banner-balance"><span>Available balance</span><strong>{formatMoney(vaulet.totals?.balance, vaulet.currency)}</strong></div>
        </div>
        <div className="banner-meta">
          <span>{vaulet.members?.length || 0} members</span>
          {vaulet.budget != null && <span>Target {formatMoney(vaulet.budget, vaulet.currency)}</span>}
          <span>{vaulet.transactions?.length || 0} transactions</span>
        </div>
        <div className="banner-mark" aria-hidden="true">V</div>
      </section>
      <nav className="section-tabs" aria-label="Vaulet sections">
        {tabs.map((tab) => (
          <NavLink key={tab.label} to={`${root}${tab.suffix}`} end={tab.suffix === ""} className={({ isActive }) => isActive ? "section-tab active" : "section-tab"}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet context={{ vaulet, refreshVaulet: refresh }} />
    </div>
  );
}
