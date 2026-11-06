import { config } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectDB, disconnectDB } from "./db/index.js";
import { app } from "./app.js";

let server;

async function start() {
  try {
    await connectDB();
  } catch (err) {
    logger.fatal({ err }, "MongoDB connection failed");
    process.exit(1);
  }

  server = app.listen(config.port, () => {
    logger.info(`🚀 VideoTube API listening on port ${config.port} (${config.env})`);
  });
  // Large video uploads can take a while – don't cut them off at Node's default timeout
  server.requestTimeout = 15 * 60 * 1000;
}

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Shutting down gracefully…");

  const force = setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();

  try {
    if (server) await new Promise((resolve) => server.close(resolve)); // stop accepting, finish in-flight
    await disconnectDB();
    clearTimeout(force);
    logger.info("Shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => logger.error({ err: reason }, "Unhandled promise rejection"));
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  shutdown("uncaughtException");
});

start();
