import fastifyCookie from "@fastify/cookie";
import { AppError, ErrorCode } from "@vlxd/shared";
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { describe, expect, it, vi } from "vitest";
import type { Config } from "../../../platform/config.js";
import { registerErrorHandlers } from "../../../platform/http/error-handler.js";
import { authPlugin } from "../plugin.js";
import { authRoutes } from "../routes.js";
import type { AuthService } from "../service.js";

function buildTestAuthApp(mockAuthService: AuthService) {
  const app = Fastify().withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  registerErrorHandlers(app);
  app.register(fastifyCookie);

  const mockConfig = {
    NODE_ENV: "test",
    PORT: 3001,
    HOST: "0.0.0.0",
    LOG_LEVEL: "silent",
  } as unknown as Config;

  app.register(authPlugin, { authService: mockAuthService });
  app.register(authRoutes, { config: mockConfig, authService: mockAuthService });

  return app;
}

describe("Auth Routes HTTP Integration", () => {
  const mockAuthService = {
    login: vi.fn(),
    logout: vi.fn(),
    getAuthMe: vi.fn(),
    validateSession: vi.fn(),
  } as unknown as AuthService;

  const validValidatedSession = {
    session: {
      id: "sess-1",
      token_hash: "hash",
      user_id: "u-1",
      tenant_id: "t-1",
      ip_address: null,
      user_agent: null,
      expires_at: new Date(),
      created_at: new Date(),
      last_seen_at: new Date(),
      revoked_at: null,
    },
    user: {
      id: "u-1",
      email: "admin@vlxd.vn",
      phone: null,
      full_name: "Admin",
      password_hash: "hash",
      status: "ACTIVE" as const,
      created_at: new Date(),
      updated_at: new Date(),
      archived_at: null,
    },
    tenant: {
      id: "t-1",
      code: "VLXD",
      name: "VLXD Co",
      tax_code: null,
      phone: null,
      email: null,
      address: null,
      status: "ACTIVE" as const,
      settings: {} as unknown as never,
      created_at: new Date(),
      updated_at: new Date(),
      archived_at: null,
    },
    tenantUser: {
      id: "tu-1",
      tenant_id: "t-1",
      user_id: "u-1",
      status: "ACTIVE" as const,
      is_owner: true,
      created_at: new Date(),
      updated_at: new Date(),
      archived_at: null,
    },
  };

  describe("POST /api/v1/auth/login", () => {
    it("returns 200, LoginResponse envelope, and sets HttpOnly cookie on valid credentials", async () => {
      const app = buildTestAuthApp(mockAuthService);

      const mockLoginResult = {
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "admin@vlxd.vn",
          fullName: "Quản Trị Viên",
          status: "ACTIVE" as const,
        },
        tenant: {
          id: "550e8400-e29b-41d4-a716-446655440001",
          code: "VLXD-DEFAULT",
          name: "Công ty VLXD Mẫu",
          status: "ACTIVE" as const,
        },
        session: {
          id: "550e8400-e29b-41d4-a716-446655440002",
          expiresAt: "2026-08-30T00:00:00.000Z",
          createdAt: "2026-08-23T00:00:00.000Z",
        },
        token: "3a7b5e9f1c8d2a4e6b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a",
      };

      vi.mocked(mockAuthService.login).mockResolvedValue(mockLoginResult);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "admin@vlxd.vn",
          password: "SecurePassword123",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.user.email).toBe("admin@vlxd.vn");
      expect(body.tenant.code).toBe("VLXD-DEFAULT");
      expect(body.token).toBe(mockLoginResult.token);

      const setCookie = response.headers["set-cookie"];
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain("vlxd_session=");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("SameSite=Lax");
    });

    it("returns 400 validation error when email is invalid format", async () => {
      const app = buildTestAuthApp(mockAuthService);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "not-an-email",
          password: "123",
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 401 when service throws INVALID_CREDENTIALS", async () => {
      const app = buildTestAuthApp(mockAuthService);

      vi.mocked(mockAuthService.login).mockRejectedValue(
        new AppError("Invalid email or password", ErrorCode.INVALID_CREDENTIALS, 401),
      );

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "admin@vlxd.vn",
          password: "WrongPassword",
        },
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("returns 401 when no session cookie or bearer token is provided", async () => {
      const app = buildTestAuthApp(mockAuthService);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 200 profile when valid cookie is provided", async () => {
      const app = buildTestAuthApp(mockAuthService);

      vi.mocked(mockAuthService.validateSession).mockResolvedValue(validValidatedSession);

      vi.mocked(mockAuthService.getAuthMe).mockResolvedValue({
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "admin@vlxd.vn",
          fullName: "Admin",
          status: "ACTIVE",
        },
        tenant: {
          id: "550e8400-e29b-41d4-a716-446655440001",
          code: "VLXD",
          name: "VLXD Co",
          status: "ACTIVE",
        },
        session: {
          id: "550e8400-e29b-41d4-a716-446655440002",
          expiresAt: "2026-08-30T00:00:00.000Z",
        },
        isOwner: true,
        titles: [],
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        cookies: {
          vlxd_session: "valid-session-token-12345",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.user.email).toBe("admin@vlxd.vn");
      expect(body.isOwner).toBe(true);
    });

    it("returns 200 profile when valid Bearer header is provided", async () => {
      const app = buildTestAuthApp(mockAuthService);

      vi.mocked(mockAuthService.validateSession).mockResolvedValue(validValidatedSession);

      vi.mocked(mockAuthService.getAuthMe).mockResolvedValue({
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "admin@vlxd.vn",
          fullName: "Admin",
          status: "ACTIVE",
        },
        tenant: {
          id: "550e8400-e29b-41d4-a716-446655440001",
          code: "VLXD",
          name: "VLXD Co",
          status: "ACTIVE",
        },
        session: {
          id: "550e8400-e29b-41d4-a716-446655440002",
          expiresAt: "2026-08-30T00:00:00.000Z",
        },
        isOwner: true,
        titles: [],
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: {
          authorization: "Bearer valid-bearer-token",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.user.email).toBe("admin@vlxd.vn");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("clears session cookie and returns 200 on logout", async () => {
      const app = buildTestAuthApp(mockAuthService);

      vi.mocked(mockAuthService.validateSession).mockResolvedValue(validValidatedSession);

      vi.mocked(mockAuthService.logout).mockResolvedValue({
        success: true,
        message: "Logout successful",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/logout",
        cookies: {
          vlxd_session: "token-to-revoke",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);

      const setCookie = response.headers["set-cookie"];
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain("vlxd_session=;");
    });
  });
});
