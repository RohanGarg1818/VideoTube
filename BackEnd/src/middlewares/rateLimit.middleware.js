import { rateLimit } from "express-rate-limit";
import { config } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const handler = (_req, _res, next, options) =>
  next(new ApiError(options.statusCode, "Too many requests, please try again later."));

const build = (limit) =>
  config.rateLimit.enabled
    ? rateLimit({
        windowMs: config.rateLimit.windowMs,
        limit,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        handler,
      })
    : (_req, _res, next) => next();

/** Global limiter for all API routes. */
export const apiLimiter = build(config.rateLimit.max);

/** Strict limiter for credential endpoints (brute-force protection). */
export const authLimiter = build(config.rateLimit.authMax);
