export { authPlugin } from "./plugin.js";
export type {
  AuthenticatedSession,
  AuthenticatedTenant,
  AuthenticatedUser,
  AuthPluginOptions,
} from "./plugin.js";

export { authRoutes } from "./routes.js";
export type { AuthRoutesOptions } from "./routes.js";

export { AuthService, SESSION_TTL_MS } from "./service.js";
export type { LoginContext } from "./service.js";

export { AuthRepository } from "./repository.js";
export type {
  CreateAuditLogParams,
  CreateSessionParams,
  UserProfileWithTitles,
} from "./repository.js";

export { generateSessionToken, hashPassword, hashSessionToken, verifyPassword } from "./crypto.js";

export {
  AuthMeResponseSchema,
  AuthSessionSchema,
  AuthTenantSchema,
  AuthTitleSchema,
  AuthUserSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  LogoutResponseSchema,
} from "./schema.js";

export type {
  AuthMeResponse,
  AuthSession,
  AuthTenant,
  AuthTitle,
  AuthUser,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from "./schema.js";
