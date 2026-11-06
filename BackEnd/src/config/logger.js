import pino from "pino";
import { createRequire } from "module";
import { config } from "./env.js";

const require = createRequire(import.meta.url);

function prettyTransport() {
  if (config.isProduction || config.isTest) return undefined;
  try {
    require.resolve("pino-pretty");
    return {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
    };
  } catch {
    return undefined; // pino-pretty is a dev dependency – fall back to JSON logs
  }
}

export const logger = pino({
  level: config.logLevel,
  base: { service: "videotube-api" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "*.password",
      "*.refreshToken",
    ],
    censor: "[REDACTED]",
  },
  transport: prettyTransport(),
});
