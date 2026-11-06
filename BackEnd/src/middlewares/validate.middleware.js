import { ApiError } from "../utils/ApiError.js";

const formatIssues = (issues, location) =>
  issues.map((issue) => ({
    location,
    field: issue.path.join(".") || location,
    message: issue.message,
  }));

/**
 * Validates and coerces `params`, `query` and `body` with zod schemas.
 * Parsed values replace the raw ones so controllers only ever see clean, typed input
 * (this also strips unknown keys – a cheap defence against NoSQL operator injection).
 */
export const validate = (schemas) => (req, _res, next) => {
  const errors = [];
  for (const location of ["params", "query", "body"]) {
    const schema = schemas[location];
    if (!schema) continue;
    const result = schema.safeParse(req[location] ?? {});
    if (!result.success) {
      errors.push(...formatIssues(result.error.issues, location));
      continue;
    }
    if (location === "query") {
      // Express 5 exposes req.query as a getter – shadow it with the parsed object.
      Object.defineProperty(req, "query", { value: result.data, writable: true, configurable: true, enumerable: true });
    } else {
      req[location] = result.data;
    }
  }
  if (errors.length) return next(ApiError.badRequest(errors[0].message, errors));
  next();
};
