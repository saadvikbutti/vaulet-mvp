import { useState } from "react";
import { plannerService } from "../services/plannerService.js";
import { formatMoney } from "../utils/format.js";
import { InlineMessage, PageHeader } from "../components/Feedback.jsx";
import Panel from "../components/Panel.jsx";

const initialForm = { destination: "", people: "4", days: "4", budget: "", interests: "" };

function PlannerResults({ plan }) {
  return (
    <div className="planner-results">
      <Panel className="planner-budget-card">
        <div className="planner-result-top"><div><p className="eyebrow">A plan for</p><h2>{plan.destination}</h2></div><span className="budget-pill">Ceiling {formatMoney(plan.budget)}</span></div>
        <div className="planner-total"><div><span className="metric-label">Estimated total</span><strong>{formatMoney(plan.estimatedTotalCost)}</strong></div><div className="budget-remaining"><span className="metric-label">Still in the pool</span><strong>{formatMoney(plan.remainingBudget)}</strong></div></div>
        <div className="budget-track"><span style={{ width: `${Math.min(100, plan.estimatedTotalCost / Math.max(plan.budget, 1) * 100)}%` }} /></div>
      </Panel>
      <Panel title="Budget allocation" action={<span className="panel-caption">Planning guide</span>}>
        <div className="allocation-list">{plan.allocation.map((item) => <div className="allocation-row" key={item.label}><span>{item.label}</span><span className="allocation-track"><i style={{ width: `${item.percent}%` }} /></span><strong>{formatMoney(item.amount)}</strong></div>)}</div>
      </Panel>
      <Panel title="Day by day" action={<span className="panel-caption">{plan.itinerary.length} days</span>}>
        <div className="itinerary-list">{plan.itinerary.map((day) => <article className="itinerary-day" key={day.day}><div className="day-number">{String(day.day).padStart(2, "0")}</div><div className="day-copy"><h3>{day.title}</h3><ul>{day.activities.map((activity, index) => <li key={`${day.day}-${index}`}>{activity}</li>)}</ul></div><strong className="day-cost">{formatMoney(day.estimatedCost)}</strong></article>)}</div>
      </Panel>
      <div className="two-column-layout planner-suggestions">
        <Panel title="Places to stay">{plan.hotelSuggestions.map((hotel) => <div className="suggestion-row" key={hotel.name}><div><strong>{hotel.name}</strong><span>{hotel.note}</span></div><b>{formatMoney(hotel.pricePerNight)}<small> / night</small></b></div>)}</Panel>
        <Panel title="Food & things to do"><div className="suggestion-block"><h3>Activities</h3><ul>{plan.activitySuggestions.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="suggestion-block"><h3>Food ideas</h3><ul>{plan.foodSuggestions.map((item) => <li key={item}>{item}</li>)}</ul></div></Panel>
      </div>
      <p className="planner-disclaimer">Estimates are a starting point, not live quotes. Confirm details before booking.</p>
    </div>
  );
}

export default function PlannerPage() {
  const [form, setForm] = useState(initialForm);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(event) { setForm((previous) => ({ ...previous, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setPlan(null);
    setLoading(true);
    try {
      const result = await plannerService.create({ ...form, people: Number(form.people), days: Number(form.days), budget: Number(form.budget) });
      setPlan(result);
    } catch (issue) {
      setError(issue.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-stack planner-page">
      <PageHeader eyebrow="Small plans, better trips" title="Trip planner" description="Set a budget ceiling and get a simple day-by-day starting point for the group." />
      <div className="planner-layout">
        <form className="panel planner-form" onSubmit={submit}>
          <div><span className="eyebrow">Plan the outline</span><h2>Where to next?</h2></div>
          <label className="field"><span>Destination</span><input name="destination" value={form.destination} onChange={update} placeholder="Goa" maxLength={100} required /></label>
          <div className="form-two-columns"><label className="field"><span>People</span><input name="people" type="number" min="1" max="50" value={form.people} onChange={update} required /></label><label className="field"><span>Days</span><input name="days" type="number" min="1" max="30" value={form.days} onChange={update} required /></label></div>
          <label className="field"><span>Total group budget <small>INR</small></span><input name="budget" type="number" min="1" step="1" value={form.budget} onChange={update} placeholder="40,000" required /></label>
          <label className="field"><span>Interests <small>Optional</small></span><input name="interests" value={form.interests} onChange={update} maxLength={300} placeholder="beaches, local food, hiking" /></label>
          <InlineMessage message={error} />
          <button className="button button-primary button-full" disabled={loading}>{loading ? "Putting ideas together…" : "Build a trip outline"}<span>↗</span></button>
          <p className="form-footnote">The planner is a starting point. It keeps your submitted budget as a hard ceiling.</p>
        </form>
        <div className="planner-result-area">
          {loading ? <div className="planner-placeholder"><span className="spinner" /><strong>Finding a rhythm for your trip…</strong><span>This can take a few seconds.</span></div> : plan ? <PlannerResults plan={plan} /> : <div className="planner-placeholder"><span className="planner-placeholder-mark">V</span><strong>Your outline starts here.</strong><span>Enter a destination and a budget to see an itinerary and spending split.</span></div>}
        </div>
      </div>
    </div>
  );
}
