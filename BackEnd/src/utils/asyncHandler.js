/**
 * Wraps an async route handler so rejected promises reach the error middleware.
 * (Express 5 does this natively, but the wrapper keeps controllers explicit and portable.)
 */
const asyncHandler = (requestHandler) => (req, res, next) =>
  Promise.resolve(requestHandler(req, res, next)).catch(next);

export default asyncHandler;
