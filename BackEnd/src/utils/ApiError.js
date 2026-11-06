class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) this.stack = stack;
    else Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", errors = []) {
    return new ApiError(400, message, errors);
  }
  static unauthorized(message = "Unauthorized request") {
    return new ApiError(401, message);
  }
  static forbidden(message = "You are not allowed to perform this action") {
    return new ApiError(403, message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }
  static conflict(message = "Resource already exists") {
    return new ApiError(409, message);
  }
}

export { ApiError };
