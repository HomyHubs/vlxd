import { HealthResponseSchema, ReadinessResponseSchema } from "@vlxd/shared";
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import type { Kysely } from "kysely";
import type { Config } from "./platform/config.js";
import { checkDatabaseHealth, type Database } from "./platform/db/index.js";
import { registerErrorHandlers } from "./platform/http/error-handler.js";
import { parseRequestId } from "./platform/http/request-id.js";
import { createLogger } from "./platform/logger.js";

export interface AppOptions {
  config: Config;
  db?: Kysely<Database>;
}

export function buildApp(optionsOrConfig: Config | AppOptions) {
  const options: AppOptions =
    "config" in optionsOrConfig ? optionsOrConfig : { config: optionsOrConfig };

  const { config, db } = options;
  const logger = createLogger(config);

  const app = Fastify({
    loggerInstance: logger,
    requestIdHeader: "x-request-id",
    genReqId: (req) => parseRequestId(req.headers["x-request-id"]),
  }).withTypeProvider<ZodTypeProvider>();

  // Attach x-request-id to every outgoing response header
  app.addHook("onSend", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  // Configure Type Provider Compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register Global Error Handlers (404 and Error Envelope)
  registerErrorHandlers(app);

  // Liveness Health Check Route (/health)
  app.get(
    "/health",
    {
      schema: {
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    async () => {
      return {
        status: "ok" as const,
        version: "0.1.0",
        timestamp: new Date().toISOString(),
      };
    },
  );

  // Readiness Health Check Route (/health/ready)
  app.get(
    "/health/ready",
    {
      schema: {
        response: {
          200: ReadinessResponseSchema,
          503: ReadinessResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      const timestamp = new Date().toISOString();

      if (!db) {
        return reply.status(200).send({
          status: "ready",
          database: "disabled",
          timestamp,
        });
      }

      const health = await checkDatabaseHealth(db);
      if (health.connected) {
        return reply.status(200).send({
          status: "ready",
          database: "connected",
          timestamp,
        });
      }

      return reply.status(503).send({
        status: "unready",
        database: "disconnected",
        timestamp,
      });
    },
  );

  return app;
}
