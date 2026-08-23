import pino from "pino";
import type { Config } from "./config.js";

export const REDACTED_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'req.headers["set-cookie"]',
  'req.headers["x-api-key"]',
  "password",
  "password_hash",
  "token",
  "token_hash",
  "accessToken",
  "refreshToken",
  "secret",
  "credit_card",
  "creditCard",
];

export function createLogger(config: Config) {
  const isDev = config.NODE_ENV === "development";

  return pino({
    level: config.LOG_LEVEL,
    redact: {
      paths: REDACTED_PATHS,
      censor: "[REDACTED]",
    },
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          headers: req.headers,
          remoteAddress: req.remoteAddress,
          remotePort: req.remotePort,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
      err: pino.stdSerializers.err,
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
