import Transaction from "../models/Transaction.js";
import { addTransaction } from "../services/vauletService.js";

export async function listTransactions(req, res) {
  const transactions = await Transaction.find({ vaulet: req.params.id })
    .sort({ createdAt: -1 })
    .populate("user", "name");
  res.json({ data: { transactions } });
}

export async function createTransaction(req, res) {
  const transaction = await addTransaction(req.params.id, req.user.id, req.validated);
  res.status(201).json({ data: { transaction } });
}
