import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "../config/env.js";
import { sha256 } from "../utils/helpers.js";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-z0-9_.-]+$/, "Username may only contain letters, numbers, '.', '-' and '_'"],
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true, maxlength: 60, index: true },
    avatar: { type: String, required: true },
    coverImage: { type: String, default: "" },
    watchHistory: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    // Sensitive fields are never returned unless explicitly selected with "+field"
    password: { type: String, required: [true, "Password is required"], select: false },
    refreshToken: { type: String, select: false }, // stored as a SHA-256 hash, never in plain text
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, config.bcryptRounds);
});

userSchema.methods.isPasswordCorrect = async function (password) {
  if (!this.password || typeof password !== "string") return false;
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ _id: this._id, username: this.username }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });
};

userSchema.methods.generateRefreshToken = function () {
  // jwtid makes every token unique, even when two are issued within the same second
  return jwt.sign({ _id: this._id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
    jwtid: crypto.randomUUID(),
  });
};

userSchema.methods.setRefreshToken = function (token) {
  this.refreshToken = token ? sha256(token) : undefined;
};

userSchema.methods.matchesRefreshToken = function (token) {
  return Boolean(this.refreshToken) && this.refreshToken === sha256(token);
};

export const User = mongoose.model("User", userSchema);
