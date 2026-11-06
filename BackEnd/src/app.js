import crypto from "crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";

import { config } from "./config/env.js";
import { logger } from "./config/logger.js";
import { API_PREFIX } from "./constants.js";
import { apiLimiter } from "./middlewares/rateLimit.middleware.js";
import { cleanupUploads } from "./middlewares/upload.middleware.js";
import errorHandler, { notFoundHandler } from "./middlewares/error.middleware.js";
import { openApiSpec } from "./docs/openapi.js";

import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import communityRouter from "./routes/community.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", config.trustProxy); // correct client IPs behind Render / Nginx (rate limiting)

/* ---------- observability ---------- */
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = req.headers["x-request-id"] || crypto.randomUUID();
      res.setHeader("X-Request-Id", id);
      return id;
    },
    customLogLevel: (_req, res, err) =>
      err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
    autoLogging: { ignore: (req) => req.url.startsWith(`${API_PREFIX}/healthcheck`) },
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  })
);

/* ---------- security ---------- */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // pure JSON API (Swagger UI needs inline scripts)
  })
);

const allowAll = config.corsOrigins.includes("*");
app.use(
  cors({
    origin(origin, cb) {
      // allow non-browser clients (curl, Postman, server-to-server) and whitelisted origins
      if (!origin || allowAll || config.corsOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id", "RateLimit", "RateLimit-Policy"],
    maxAge: 600,
  })
);

/* ---------- parsing ---------- */
app.use(compression());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());
app.use(cleanupUploads);

/* ---------- routes ---------- */
app.get("/", (_req, res) =>
  res.json({ name: "VideoTube API", version: "2.0.0", docs: "/api-docs", health: `${API_PREFIX}/healthcheck` })
);
app.use(`${API_PREFIX}/healthcheck`, healthcheckRouter);

if (config.apiDocsEnabled) {
  app.get("/api-docs.json", (_req, res) => res.json(openApiSpec));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: "VideoTube API Docs" }));
}

app.use(API_PREFIX, apiLimiter);
app.use(`${API_PREFIX}/users`, userRouter);
app.use(`${API_PREFIX}/videos`, videoRouter);
app.use(`${API_PREFIX}/comments`, commentRouter);
app.use(`${API_PREFIX}/likes`, likeRouter);
app.use(`${API_PREFIX}/playlists`, playlistRouter);
app.use(`${API_PREFIX}/subscriptions`, subscriptionRouter);
app.use(`${API_PREFIX}/community`, communityRouter);
app.use(`${API_PREFIX}/dashboard`, dashboardRouter);

/* ---------- errors ---------- */
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
