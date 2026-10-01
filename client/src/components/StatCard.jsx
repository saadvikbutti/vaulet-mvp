export default function StatCard({ label, value, note, accent = false }) {
  return (
    <article className={`stat-card${accent ? " stat-card-accent" : ""}`}>
      <p className="metric-label">{label}</p>
      <p className="stat-value">{value}</p>
      {note && <p className="stat-note">{note}</p>}
    </article>
  );
}
