import { ApiResponse } from "../utils/ApiResponse.js";
import { isDBConnected } from "../db/index.js";

/** Liveness + readiness probe used by Render / Docker / uptime monitors. */
export const healthcheck = (_req, res) => {
  const db = isDBConnected();
  const payload = {
    status: db ? "ok" : "degraded",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: db ? "connected" : "disconnected",
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
  };
  res.status(db ? 200 : 503).json(new ApiResponse(db ? 200 : 503, payload, db ? "Healthy" : "Database unavailable"));
};
