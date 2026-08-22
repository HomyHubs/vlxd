import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { HealthResponseSchema } from "@vlxd/shared";
import type { Config } from "./platform/config.js";
import { createLogger } from "./platform/logger.js";

export function buildApp(config: Config) {
  const logger = createLogger(config);

  const app = Fastify({
    loggerInstance: logger,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Core Health Route
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

  return app;
}
