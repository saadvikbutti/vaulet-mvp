import { useState } from "react";
import { vauletService } from "../services/vauletService.js";
import { InlineMessage } from "./Feedback.jsx";

export default function MemberForm({ vauletId, onAdded }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const member = await vauletService.addMember(vauletId, email.trim());
      setSuccess(`${member.user?.name || "Member"} was added to this Vaulet.`);
      setEmail("");
      await onAdded?.();
    } catch (issue) {
      setError(issue.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="invite-form" onSubmit={submit}>
      <label className="field"><span>Account email</span><input type="email" autoComplete="email" placeholder="friend@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <button className="button button-primary" disabled={saving}>{saving ? "Adding…" : "Add member"}</button>
      <InlineMessage message={error} />
      <InlineMessage message={success} tone="success" />
    </form>
  );
}
