import pino from "pino";
import type { Config } from "./config.js";

export function createLogger(config: Config) {
  const isDev = config.NODE_ENV === "development";

  return pino({
    level: config.LOG_LEVEL,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "password",
        "token",
        "accessToken",
        "refreshToken",
        "secret",
      ],
      censor: "[REDACTED]",
    },
    transport: isDev
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
          },
        }
      : undefined,
  });
}
