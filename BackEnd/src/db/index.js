import mongoose from "mongoose";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";

mongoose.set("strictQuery", true); // drop unknown fields from query filters

mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));
mongoose.connection.on("error", (err) => logger.error({ err }, "MongoDB error"));

export async function connectDB(uri = config.mongo.uri) {
  const conn = await mongoose.connect(uri, {
    dbName: config.mongo.dbName, // undefined → use DB from URI
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10_000,
  });
  logger.info({ host: conn.connection.host, db: conn.connection.name }, "MongoDB connected");
  return conn;
}

export async function disconnectDB() {
  await mongoose.connection.close();
}

export const isDBConnected = () => mongoose.connection.readyState === 1;

export default connectDB;
