import mongoose from "mongoose";
import multer from "multer";
import { config } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/** Normalises any thrown value into an ApiError with a sensible HTTP status. */
function normalise(err) {
  if (err instanceof ApiError) return err;

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for "${err.path}"`);
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest(errors[0]?.message ?? "Validation failed", errors);
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? err.keyPattern ?? {})[0] ?? "field";
    return ApiError.conflict(`A record with this ${field} already exists`);
  }
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return new ApiError(status, err.code === "LIMIT_FILE_SIZE" ? "Uploaded file is too large" : err.message);
  }
  if (err?.type === "entity.parse.failed") return ApiError.badRequest("Malformed JSON body");
  if (err?.type === "entity.too.large") return new ApiError(413, "Request body too large");

  const wrapped = new ApiError(err?.statusCode || err?.status || 500, err?.message || "Internal Server Error");
  wrapped.stack = err?.stack;
  return wrapped;
}

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  const error = normalise(err);
  const status = error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500;
  const isServerError = status >= 500;

  // pino-http picks up `res.err` and logs it once, together with the request summary
  if (isServerError) res.err = err;

  res.status(status).json({
    statusCode: status,
    success: false,
    // Never leak internals of unexpected errors to clients in production
    message: isServerError && config.isProduction ? "Internal Server Error" : error.message,
    errors: error.errors ?? [],
    requestId: req.id,
    ...(config.isProduction || !isServerError ? {} : { stack: error.stack }),
  });
};

export default errorHandler;
