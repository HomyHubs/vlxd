import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test", "staging"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().min(1).default("0.0.0.0"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  DATABASE_URL: z.string().optional(),
  DATABASE_POOL_MIN: z.coerce.number().int().nonnegative().default(0),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_SSL: z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
    .transform((val) => val === true || val === "true" || val === "1")
    .default(false),
  DATABASE_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
});

export type Config = z.infer<typeof EnvSchema>;

export class ConfigValidationError extends Error {
  public readonly issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    const formatted = issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    super(`Invalid environment configuration:\n${formatted}`);
    this.name = "ConfigValidationError";
    this.issues = issues;
    Object.setPrototypeOf(this, ConfigValidationError.prototype);
  }
}

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const result = EnvSchema.safeParse(env);
  if (!result.success) {
    throw new ConfigValidationError(result.error.issues);
  }
  return result.data;
}
