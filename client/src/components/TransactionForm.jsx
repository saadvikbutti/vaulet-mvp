import { useState } from "react";
import { vauletService } from "../services/vauletService.js";
import { InlineMessage } from "./Feedback.jsx";

const categories = ["Food", "Hotel", "Transport", "Activities", "Shopping", "Tickets", "Other"];

export default function TransactionForm({ vauletId, type, currency, onSaved }) {
  const contribution = type === "contribution";
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const [merchant, setMerchant] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await vauletService.addTransaction(vauletId, {
        type,
        amount: Number(amount),
        description: description.trim(),
        category: contribution ? undefined : category,
        merchant: contribution ? undefined : merchant.trim(),
      });
      setAmount("");
      setDescription("");
      setMerchant("");
      await onSaved?.();
    } catch (issue) {
      setError(issue.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel form-panel" onSubmit={submit}>
      <div className="form-panel-heading"><span className={`form-icon ${contribution ? "positive" : "negative"}`}>{contribution ? "+" : "−"}</span><div><h2>{contribution ? "Add money" : "Add an expense"}</h2><p>{contribution ? "Record a member’s contribution." : "Keep spending visible to everyone."}</p></div></div>
      <label className="field"><span>Amount <small>{currency}</small></span><input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></label>
      <label className="field"><span>{contribution ? "Note" : "Description"}</span><input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder={contribution ? "Optional note" : "Dinner with the group"} /></label>
      {!contribution && <>
        <label className="field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field"><span>Merchant or location <small>Optional</small></span><input value={merchant} onChange={(event) => setMerchant(event.target.value)} maxLength={200} /></label>
      </>}
      <InlineMessage message={error} />
      <button className="button button-primary button-full" disabled={saving}>{saving ? "Saving…" : contribution ? "Record contribution" : "Record expense"}</button>
    </form>
  );
}
