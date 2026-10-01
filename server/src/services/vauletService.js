import mongoose from "mongoose";
import Memory from "../models/Memory.js";
import Transaction from "../models/Transaction.js";
import Vaulet from "../models/Vaulet.js";
import VauletMember from "../models/VauletMember.js";
import { HttpError } from "../utils/HttpError.js";

export function calculateTotals(transactions) {
  let contributedCents = 0;
  let spentCents = 0;
  const categoryCents = {};

  for (const transaction of transactions) {
    const amountCents = Math.round(Number(transaction.amount) * 100);
    if (transaction.type === "contribution") {
      contributedCents += amountCents;
    } else if (transaction.type === "expense") {
      spentCents += amountCents;
      const category = transaction.category || "Other";
      categoryCents[category] = (categoryCents[category] || 0) + amountCents;
    }
  }

  const byCategory = Object.fromEntries(Object.entries(categoryCents).map(([category, cents]) => [category, cents / 100]));
  const contributed = contributedCents / 100;
  const spent = spentCents / 100;
  return { contributed, spent, balance: (contributedCents - spentCents) / 100, byCategory };
}

export async function listVauletsForUser(userId) {
  const memberships = await VauletMember.find({ user: userId }).sort({ joinedAt: -1 }).populate("vaulet");
  const cards = await Promise.all(memberships.filter((item) => item.vaulet).map(async (membership) => {
    const vauletId = membership.vaulet.id;
    const [memberCount, allTransactions, recentTransactions] = await Promise.all([
      VauletMember.countDocuments({ vaulet: vauletId }),
      Transaction.find({ vaulet: vauletId }).select("type amount category"),
      Transaction.find({ vaulet: vauletId }).sort({ createdAt: -1 }).limit(5).populate("user", "name"),
    ]);
    return {
      ...membership.vaulet.toObject(),
      memberCount,
      totals: calculateTotals(allTransactions),
      recentTransactions,
    };
  }));
  return cards;
}

export async function getVauletDetails(vauletId) {
  const vaulet = await Vaulet.findById(vauletId).lean();
  if (!vaulet) throw new HttpError(404, "Vaulet not found.");

  const [members, transactions, memories] = await Promise.all([
    VauletMember.find({ vaulet: vauletId }).sort({ joinedAt: 1 }).populate("user", "name email avatar"),
    Transaction.find({ vaulet: vauletId }).sort({ createdAt: -1 }).populate("user", "name"),
    Memory.countDocuments({ vaulet: vauletId }),
  ]);

  return { ...vaulet, members, transactions, memoryCount: memories, totals: calculateTotals(transactions) };
}

export async function createVaulet(userId, input) {
  const session = await mongoose.startSession();
  let vauletId;
  try {
    await session.withTransaction(async () => {
      const [vaulet] = await Vaulet.create([{ ...input, createdBy: userId }], { session });
      await VauletMember.create([{ vaulet: vaulet.id, user: userId, role: "owner" }], { session });
      vauletId = vaulet.id;
    });
  } finally {
    await session.endSession();
  }
  return getVauletDetails(vauletId);
}

export async function addTransaction(vauletId, userId, input) {
  const amount = Math.round(input.amount * 100) / 100;
  if (amount < 0.01) throw new HttpError(400, "Amount must be at least 0.01.");
  const session = await mongoose.startSession();
  let transaction;
  try {
    await session.withTransaction(async () => {
      await touchActiveVaulet(vauletId, session);

      if (input.type === "expense") {
        const transactions = await Transaction.find({ vaulet: vauletId }).select("type amount").session(session);
        const { balance } = calculateTotals(transactions);
        if (amount > balance) {
          throw new HttpError(400, "This expense would exceed the Vaulet's available balance.");
        }
      }

      [transaction] = await Transaction.create([{
        ...input,
        amount,
        category: input.type === "expense" ? input.category || "Other" : undefined,
        vaulet: vauletId,
        user: userId,
      }], { session });
    });
  } finally {
    await session.endSession();
  }
  await transaction.populate("user", "name");
  return transaction;
}

export async function addVauletMember(vauletId, userId) {
  const session = await mongoose.startSession();
  let member;
  try {
    await session.withTransaction(async () => {
      await touchActiveVaulet(vauletId, session);
      [member] = await VauletMember.create([{ vaulet: vauletId, user: userId, role: "member" }], { session });
    });
  } finally {
    await session.endSession();
  }
  await member.populate("user", "name email avatar");
  return member;
}

export async function addMemoryRecord(vauletId, memoryData) {
  const session = await mongoose.startSession();
  let memory;
  try {
    await session.withTransaction(async () => {
      await touchActiveVaulet(vauletId, session);
      [memory] = await Memory.create([{ ...memoryData, vaulet: vauletId }], { session });
    });
  } finally {
    await session.endSession();
  }
  return memory;
}

export async function deleteVaulet(vauletId) {
  const deletionMarker = await Vaulet.updateOne(
    { _id: vauletId, deleting: { $ne: true } },
    { $set: { deleting: true }, $inc: { ledgerVersion: 1 } }
  );
  if (deletionMarker.matchedCount === 0) {
    const exists = await Vaulet.exists({ _id: vauletId });
    if (!exists) throw new HttpError(404, "Vaulet not found.");
    throw new HttpError(409, "Vaulet deletion is already in progress.");
  }

  let memoryPublicIds;
  let session;
  try {
    session = await mongoose.startSession();
    const memories = await Memory.find({ vaulet: vauletId }).select("storagePublicId").lean();
    memoryPublicIds = memories.map((memory) => memory.storagePublicId);
    await session.withTransaction(async () => {
      await VauletMember.deleteMany({ vaulet: vauletId }, { session });
      await Transaction.deleteMany({ vaulet: vauletId }, { session });
      await Memory.deleteMany({ vaulet: vauletId }, { session });
      await Vaulet.deleteOne({ _id: vauletId }, { session });
    });
  } catch (error) {
    try {
      await Vaulet.updateOne({ _id: vauletId, deleting: true }, { $set: { deleting: false } });
    } catch (resetError) {
      console.error("Could not release the Vaulet deletion marker after a failed cascade:", resetError);
    }
    throw error;
  } finally {
    if (session) await session.endSession();
  }
  return { deleted: true, memoryPublicIds };
}

async function touchActiveVaulet(vauletId, session) {
  const marker = await Vaulet.updateOne(
    { _id: vauletId, deleting: { $ne: true } },
    { $inc: { ledgerVersion: 1 } },
    { session }
  );
  if (marker.matchedCount > 0) return;

  const exists = await Vaulet.exists({ _id: vauletId }).session(session);
  if (!exists) throw new HttpError(404, "Vaulet not found.");
  throw new HttpError(409, "This Vaulet is being deleted. Please try again later.");
}

export function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}
