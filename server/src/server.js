import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database.js";

dotenv.config({ path: new URL("../.env", import.meta.url) });
const { default: app } = await import("./app.js");

const port = Number(process.env.PORT) || 5000;
try {
  await connectDatabase();
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Vaulet API listening on port ${port}`);
  });

  async function shutDown(signal) {
    console.log(`${signal} received; closing the API server.`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => shutDown("SIGTERM"));
  process.on("SIGINT", () => shutDown("SIGINT"));
} catch (error) {
  console.error("The Vaulet API could not start:", error.message);
  process.exit(1);
}
