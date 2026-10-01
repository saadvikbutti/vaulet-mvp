import { useOutletContext } from "react-router-dom";
import { getId, formatDate } from "../utils/format.js";
import MemberForm from "../components/MemberForm.jsx";
import Panel from "../components/Panel.jsx";

export default function MembersPage() {
  const { vaulet, refreshVaulet } = useOutletContext();
  const members = vaulet.members || [];
  return (
    <div className="two-column-layout members-layout">
      <Panel title={`Members (${members.length})`} action={<span className="panel-caption">Your trip circle</span>}>
        <div className="members-list">{members.map((membership) => <article className="member-row" key={getId(membership)}><span className="member-avatar">{membership.user?.name?.slice(0, 1)?.toUpperCase() || "V"}</span><div className="member-details"><strong>{membership.user?.name || "Member"}</strong><span>{membership.user?.email || ""}</span><small>Joined {formatDate(membership.joinedAt, { month: "short", year: "numeric" })}</small></div><span className={`role-badge ${membership.role === "owner" ? "owner" : ""}`}>{membership.role}</span></article>)}</div>
      </Panel>
      <div className="invite-column"><div><p className="eyebrow">Bring someone along</p><h2>Invite a member</h2><p className="muted-copy">They’ll need a Vaulet account already. If they haven’t joined yet, ask them to sign up first.</p></div><Panel><MemberForm vauletId={getId(vaulet)} onAdded={refreshVaulet} /></Panel><div className="note-card"><span className="note-mark">i</span><p>Members can add contributions, expenses, memories, and other existing members.</p></div></div>
    </div>
  );
}
