import { Link } from "react-router-dom";
import { useLoad } from "../hooks/useLoad.js";
import { vauletService } from "../services/vauletService.js";
import { getId } from "../utils/format.js";
import VauletCard from "../components/VauletCard.jsx";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../components/Feedback.jsx";

export default function VauletsPage() {
  const { data: vaulets = [], loading, error, refresh } = useLoad(vauletService.list, []);
  if (loading) return <LoadingState label="Loading your Vaulets…" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Plans made together" title="Your Vaulets" description="Each Vaulet brings your group wallet, people, and trip memories into one place." action={<Link className="button button-primary" to="/vaulets/new">Create Vaulet <span>↗</span></Link>} />
      {vaulets.length ? <div className="vault-grid">{vaulets.map((vaulet) => <VauletCard key={getId(vaulet)} vaulet={vaulet} />)}</div> : <EmptyState title="No Vaulets yet" description="Start a shared wallet for a trip or experience. You can add people after they create an account." action={<Link className="button button-primary" to="/vaulets/new">Create your first Vaulet <span>↗</span></Link>} />}
    </div>
  );
}
