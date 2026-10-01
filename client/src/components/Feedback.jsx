export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-action">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }) {
  return <div className="loading-state"><span className="spinner" aria-hidden="true" />{label}</div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="notice notice-error" role="alert">
      <span>{message}</span>
      {onRetry && <button className="text-button" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function InlineMessage({ message, tone = "error" }) {
  if (!message) return null;
  return <p className={`inline-message ${tone}`} role={tone === "error" ? "alert" : "status"}>{message}</p>;
}

export function EmptyState({ title, description, action }) {
  return (
    <section className="empty-state">
      <span className="empty-mark" aria-hidden="true">V</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}
