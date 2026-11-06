import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const extractAccessToken = (req) => {
  const header = req.header("Authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  return req.cookies?.accessToken || null;
};

async function resolveUser(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.accessSecret);
  } catch (err) {
    throw ApiError.unauthorized(err.name === "TokenExpiredError" ? "Access token expired" : "Invalid access token");
  }
  const user = await User.findById(decoded?._id);
  if (!user) throw ApiError.unauthorized("Invalid access token");
  return user;
}

/** Requires a valid access token (Bearer header or httpOnly cookie). */
export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const token = extractAccessToken(req);
  if (!token) throw ApiError.unauthorized("Authentication required");
  req.user = await resolveUser(token);
  next();
});

/** Attaches `req.user` when a valid token is present, otherwise continues anonymously. */
export const optionalVerifyJWT = asyncHandler(async (req, _res, next) => {
  const token = extractAccessToken(req);
  if (token) {
    try {
      req.user = await resolveUser(token);
    } catch {
      /* anonymous access */
    }
  }
  next();
});
