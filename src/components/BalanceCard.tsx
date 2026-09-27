export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-line rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-muted mb-1">{label}</p>
      <p className="text-2xl font-semibold text-ink">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

export function formatMoney(amount: number, currency: string = "INR") {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency + " ";
  return `${symbol}${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
