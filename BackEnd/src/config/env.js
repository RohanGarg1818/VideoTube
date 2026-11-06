import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: process.env.DOTENV_PATH || "./.env", quiet: true });

const bool = (fallback) =>
  z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => (v === undefined ? fallback : v === "true" || v === "1"));

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(8000),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),

    MONGODB_URI: z.string({ error: "MONGODB_URI is required" }).min(1, "MONGODB_URI is required"),
    // Optional: when omitted, the database in the connection string (or MongoDB's default) is used.
    DB_NAME: z.string().optional(),

    // Comma separated list of allowed browser origins, e.g. "http://localhost:5173,https://app.vercel.app"
    CORS_ORIGIN: z.string().default("http://localhost:5173,http://localhost:8080"),
    TRUST_PROXY: z.coerce.number().int().min(0).default(1),

    ACCESS_TOKEN_SECRET: z
      .string({ error: "ACCESS_TOKEN_SECRET is required" })
      .min(16, "ACCESS_TOKEN_SECRET must be at least 16 chars"),
    ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
    REFRESH_TOKEN_SECRET: z
      .string({ error: "REFRESH_TOKEN_SECRET is required" })
      .min(16, "REFRESH_TOKEN_SECRET must be at least 16 chars"),
    REFRESH_TOKEN_EXPIRY: z.string().default("10d"),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),

    MEDIA_STORAGE: z.enum(["cloudinary", "mock"]).default("cloudinary"),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    CLOUDINARY_FOLDER: z.string().default("videotube"),

    RATE_LIMIT_ENABLED: bool(true),
    RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1000),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

    API_DOCS_ENABLED: bool(true),
  })
  .superRefine((env, ctx) => {
    if (env.MEDIA_STORAGE === "cloudinary") {
      for (const key of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) {
        if (!env[key]) {
          ctx.addIssue({ code: "custom", path: [key], message: `${key} is required when MEDIA_STORAGE=cloudinary` });
        }
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  // Fail fast: a misconfigured server should never boot half-working.
  console.error(`\n❌ Invalid environment configuration:\n${details}\n`);
  process.exit(1);
}

const env = parsed.data;

export const config = Object.freeze({
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  port: env.PORT,
  logLevel: env.LOG_LEVEL ?? (env.NODE_ENV === "test" ? "silent" : env.NODE_ENV === "production" ? "info" : "debug"),
  mongo: { uri: env.MONGODB_URI, dbName: env.DB_NAME },
  corsOrigins: env.CORS_ORIGIN.split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean),
  trustProxy: env.TRUST_PROXY,
  jwt: {
    accessSecret: env.ACCESS_TOKEN_SECRET,
    accessExpiry: env.ACCESS_TOKEN_EXPIRY,
    refreshSecret: env.REFRESH_TOKEN_SECRET,
    refreshExpiry: env.REFRESH_TOKEN_EXPIRY,
  },
  bcryptRounds: env.BCRYPT_SALT_ROUNDS,
  media: {
    driver: env.MEDIA_STORAGE,
    folder: env.CLOUDINARY_FOLDER,
    cloudinary: {
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    },
  },
  rateLimit: {
    enabled: env.RATE_LIMIT_ENABLED,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    authMax: env.AUTH_RATE_LIMIT_MAX,
  },
  apiDocsEnabled: env.API_DOCS_ENABLED,
});
