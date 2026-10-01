import mongoose from "mongoose";
import PlannerRateLimitBucket from "../models/PlannerRateLimitBucket.js";

export async function connectDatabase() {
  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Add your MongoDB Atlas connection string to server/.env.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(MONGODB_URI);
  await PlannerRateLimitBucket.createIndexes();
  console.log("Connected to MongoDB");
}
