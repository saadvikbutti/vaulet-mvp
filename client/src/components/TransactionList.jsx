import { formatDate, formatMoney } from "../utils/format.js";

export default function TransactionList({ transactions, currency = "INR", showWallet = false }) {
  if (!transactions?.length) return <p className="muted-copy">No transactions yet. Add a contribution or expense from the Wallet tab.</p>;
  return (
    <div className="transaction-list">
      {transactions.map((item) => {
        const contribution = item.type === "contribution";
        const userName = item.user?.name || "A member";
        return (
          <article className="transaction-row" key={item.id || item._id}>
            <span className={`transaction-symbol ${contribution ? "positive" : "negative"}`}>{contribution ? "+" : "−"}</span>
            <div className="transaction-copy">
              <strong>{userName} {contribution ? "added to" : "spent from"} {showWallet && item.vauletName ? item.vauletName : "the wallet"}</strong>
              <span>{item.description || (contribution ? "Wallet contribution" : item.category || "Expense")}{item.category && item.description ? ` · ${item.category}` : ""}{item.merchant ? ` · ${item.merchant}` : ""}</span>
              {item.createdAt && <small>{formatDate(item.createdAt, { day: "numeric", month: "short", year: "numeric" })}</small>}
            </div>
            <strong className={`transaction-amount ${contribution ? "positive" : ""}`}>{contribution ? "+" : "−"}{formatMoney(item.amount, currency)}</strong>
          </article>
        );
      })}
    </div>
  );
}
