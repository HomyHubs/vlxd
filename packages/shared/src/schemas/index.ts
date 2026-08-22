import { z } from "zod";
import { ErrorCode } from "../errors/index.js";

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export const MoneySchema = z
  .number()
  .int()
  .nonnegative()
  .describe("Amount in smallest currency unit (VND integer)");

export const DateStringSchema = z
  .string()
  .datetime({ offset: true })
  .describe("ISO 8601 UTC timestamp");

export const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.enum(Object.values(ErrorCode) as [string, ...string[]]),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    requestId: z.string().optional(),
  }),
});

export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  version: z.string(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
