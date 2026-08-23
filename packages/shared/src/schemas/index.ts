import { z } from "zod";
import { ErrorCode, type ErrorCodeType } from "../errors/index.js";

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

const errorCodes = Object.values(ErrorCode) as [ErrorCodeType, ...ErrorCodeType[]];

export const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.enum(errorCodes),
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

export const ReadinessResponseSchema = z.object({
  status: z.enum(["ready", "unready"]),
  database: z.enum(["connected", "disconnected", "disabled"]),
  timestamp: z.string(),
});

export type ReadinessResponse = z.infer<typeof ReadinessResponseSchema>;

// Auth schemas
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantCode: z.string().optional(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  fullName: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED", "ARCHIVED"]),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthTenantSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  status: z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]),
});

export type AuthTenant = z.infer<typeof AuthTenantSchema>;

export const AuthSessionSchema = z.object({
  id: z.string().uuid(),
  expiresAt: z.string(),
  createdAt: z.string().optional(),
});

export type AuthSession = z.infer<typeof AuthSessionSchema>;

export const AuthTitleSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  roleGroup: z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
  }),
});

export type AuthTitle = z.infer<typeof AuthTitleSchema>;

export const LoginResponseSchema = z.object({
  user: AuthUserSchema,
  tenant: AuthTenantSchema,
  session: AuthSessionSchema,
  token: z.string(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const LogoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

export const AuthMeResponseSchema = z.object({
  user: AuthUserSchema,
  tenant: AuthTenantSchema,
  session: AuthSessionSchema,
  isOwner: z.boolean(),
  titles: z.array(AuthTitleSchema),
});

export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
