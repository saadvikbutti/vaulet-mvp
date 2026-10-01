import { useLoad } from "../hooks/useLoad.js";
import { userService } from "../services/userService.js";
import { formatDate } from "../utils/format.js";
import { ErrorState, LoadingState, PageHeader } from "../components/Feedback.jsx";
import Panel from "../components/Panel.jsx";

export default function ProfilePage() {
  const { data: user, loading, error, refresh } = useLoad(userService.profile, []);
  if (loading) return <LoadingState label="Loading your profile…" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  return (
    <div className="page-stack narrow-page">
      <PageHeader eyebrow="Your Vaulet account" title="Profile" description="A few details attached to your shared plans." />
      <Panel className="profile-card">
        <div className="profile-avatar">{user.name?.slice(0, 1)?.toUpperCase() || "V"}</div>
        <dl className="profile-fields"><div><dt>Name</dt><dd>{user.name}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Vaulets</dt><dd>{user.vauletCount}</dd></div><div><dt>Member since</dt><dd>{formatDate(user.createdAt, { month: "long", year: "numeric" })}</dd></div></dl>
      </Panel>
    </div>
  );
}
