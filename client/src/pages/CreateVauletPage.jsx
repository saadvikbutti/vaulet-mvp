import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { vauletService } from "../services/vauletService.js";
import { InlineMessage, PageHeader } from "../components/Feedback.jsx";

const currencies = ["INR", "USD", "EUR", "GBP", "CAD", "AUD", "NZD", "SGD", "AED", "JPY", "CNY", "CHF"];

export default function CreateVauletPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "", currency: "INR", budget: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(event) { setForm((previous) => ({ ...previous, [event.target.name]: event.target.value })); }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const vaulet = await vauletService.create({
        name: form.name.trim(),
        description: form.description.trim(),
        currency: form.currency,
        budget: form.budget ? Number(form.budget) : null,
      });
      navigate(`/vaulets/${vaulet.id || vaulet._id}`);
    } catch (issue) {
      setError(issue.message);
      setSaving(false);
    }
  }

  return (
    <div className="page-stack narrow-page">
      <PageHeader eyebrow="Make room for the whole group" title="Create a Vaulet" description="Give your shared wallet a name, choose its currency, and set an optional target." />
      <form className="panel form-panel create-form" onSubmit={submit}>
        <label className="field"><span>Vaulet name</span><input name="name" value={form.name} onChange={update} placeholder="Goa, together" maxLength={100} required /></label>
        <label className="field"><span>What are you planning? <small>Optional</small></span><textarea name="description" rows="3" value={form.description} onChange={update} maxLength={1000} placeholder="A long weekend by the water…" /></label>
        <div className="form-two-columns">
          <label className="field"><span>Currency</span><select name="currency" value={form.currency} onChange={update}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          <label className="field"><span>Target budget <small>Optional</small></span><input name="budget" type="number" min="0.01" step="0.01" value={form.budget} onChange={update} placeholder="40,000" /></label>
        </div>
        <InlineMessage message={error} />
        <div className="form-actions"><Link className="button button-secondary" to="/vaulets">Cancel</Link><button className="button button-primary" disabled={saving}>{saving ? "Creating…" : "Create Vaulet"} <span>↗</span></button></div>
      </form>
      <p className="muted-copy small-copy">You’ll be the Vaulet owner. Add other members from the Members tab after creation.</p>
    </div>
  );
}
