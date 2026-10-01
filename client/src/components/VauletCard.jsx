import { Link } from "react-router-dom";
import { formatMoney, getId } from "../utils/format.js";

export default function VauletCard({ vaulet }) {
  const balance = vaulet.totals?.balance || 0;
  const memberCount = vaulet.memberCount ?? vaulet.members?.length ?? 0;
  return (
    <Link to={`/vaulets/${getId(vaulet)}`} className="vault-card">
      <div className="vault-card-top">
        <div><span className="card-overline">Shared wallet</span><h3>{vaulet.name}</h3></div>
        <span className="currency-pill">{vaulet.currency || "INR"}</span>
      </div>
      {vaulet.description && <p className="vault-description">{vaulet.description}</p>}
      <div className="vault-card-bottom">
        <div><span className="metric-label">Available balance</span><strong>{formatMoney(balance, vaulet.currency)}</strong></div>
        <div className="vault-card-side">
          <span>{memberCount} {memberCount === 1 ? "member" : "members"}</span>
          {vaulet.budget != null && <span>Budget {formatMoney(vaulet.budget, vaulet.currency)}</span>}
        </div>
      </div>
      <span className="card-arrow" aria-hidden="true">↗</span>
    </Link>
  );
}
