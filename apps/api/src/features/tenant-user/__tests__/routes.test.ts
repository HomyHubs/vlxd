import fastifyCookie from "@fastify/cookie";
import { AppError, ErrorCode } from "@vlxd/shared";
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { describe, expect, it, vi } from "vitest";
import { registerErrorHandlers } from "../../../platform/http/error-handler.js";
import { authPlugin } from "../../auth/plugin.js";
import type { AuthService } from "../../auth/service.js";
import { authorizationPlugin } from "../../authorization/plugin.js";
import type { AuthorizationService } from "../../authorization/service.js";
import { tenantUserRoutes } from "../routes.js";
import type { TenantUserService } from "../service.js";

function buildTestApp(
  mockAuthService: AuthService,
  mockAuthorizationService: AuthorizationService,
  mockTenantUserService: TenantUserService,
) {
  const app = Fastify().withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  registerErrorHandlers(app);
  app.register(fastifyCookie);

  app.register(authPlugin, { authService: mockAuthService });
  app.register(authorizationPlugin, { authorizationService: mockAuthorizationService });
  app.register(tenantUserRoutes, { tenantUserService: mockTenantUserService });

  return app;
}

describe("Tenant User Routes HTTP Integration", () => {
  const mockAuthService = {
    validateSession: vi.fn(),
  } as unknown as AuthService;

  const mockAuthorizationService = {
    require: vi.fn(),
  } as unknown as AuthorizationService;

  const mockTenantUserService = {
    invite: vi.fn(),
    updateStatus: vi.fn(),
    replaceTitles: vi.fn(),
  } as unknown as TenantUserService;

  const validSession = {
    session: {
      id: "sess-1",
      token_hash: "hash",
      user_id: "u-1",
      tenant_id: "00000000-0000-4000-a000-000000000001",
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
      id: "00000000-0000-4000-a000-000000000001",
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
      tenant_id: "00000000-0000-4000-a000-000000000001",
      user_id: "u-1",
      status: "ACTIVE" as const,
      is_owner: true,
      created_at: new Date(),
      updated_at: new Date(),
      archived_at: null,
    },
  };

  describe("POST /api/v1/tenant-users (Invite)", () => {
    it("returns 401 when unauthenticated", async () => {
      const app = buildTestApp(mockAuthService, mockAuthorizationService, mockTenantUserService);
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/tenant-users",
        payload: {
          email: "user@example.com",
          titleIds: ["00000000-0000-4000-a000-000000000010"],
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("UNAUTHORIZED");
    });

    it("returns 403 when user lacks user.account.create capability", async () => {
      const app = buildTestApp(mockAuthService, mockAuthorizationService, mockTenantUserService);
      vi.mocked(mockAuthService.validateSession).mockResolvedValue(validSession);
      vi.mocked(mockAuthorizationService.require).mockRejectedValue(
        new AppError("Insufficient permissions", ErrorCode.FORBIDDEN, 403),
      );

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/tenant-users",
        cookies: { vlxd_session: "valid-token" },
        payload: {
          email: "user@example.com",
          titleIds: ["00000000-0000-4000-a000-000000000010"],
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("FORBIDDEN");
    });

    it("returns 201 on valid invitation", async () => {
      const app = buildTestApp(mockAuthService, mockAuthorizationService, mockTenantUserService);
      vi.mocked(mockAuthService.validateSession).mockResolvedValue(validSession);
      vi.mocked(mockAuthorizationService.require).mockResolvedValue();

      const createdRecord = {
        id: "00000000-0000-4000-a000-000000000099",
        tenantId: "00000000-0000-4000-a000-000000000001",
        userId: "00000000-0000-4000-a000-000000000002",
        email: "staff@example.com",
        fullName: "Staff Member",
        status: "ACTIVE" as const,
        titleIds: ["00000000-0000-4000-a000-000000000010"],
      };
      vi.mocked(mockTenantUserService.invite).mockResolvedValue(createdRecord);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/tenant-users",
        cookies: { vlxd_session: "valid-token" },
        payload: {
          email: "staff@example.com",
          titleIds: ["00000000-0000-4000-a000-000000000010"],
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(createdRecord);
    });

    it("returns 400 when request body has invalid email or empty titles", async () => {
      const app = buildTestApp(mockAuthService, mockAuthorizationService, mockTenantUserService);
      vi.mocked(mockAuthService.validateSession).mockResolvedValue(validSession);
      vi.mocked(mockAuthorizationService.require).mockResolvedValue();

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/tenant-users",
        cookies: { vlxd_session: "valid-token" },
        payload: {
          email: "not-an-email",
          titleIds: [],
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("PATCH /api/v1/tenant-users/:tenantUserId/status", () => {
    it("returns 200 on valid status change", async () => {
      const app = buildTestApp(mockAuthService, mockAuthorizationService, mockTenantUserService);
      vi.mocked(mockAuthService.validateSession).mockResolvedValue(validSession);
      vi.mocked(mockAuthorizationService.require).mockResolvedValue();

      const updatedRecord = {
        id: "00000000-0000-4000-a000-000000000099",
        tenantId: "00000000-0000-4000-a000-000000000001",
        userId: "00000000-0000-4000-a000-000000000002",
        email: "staff@example.com",
        fullName: "Staff Member",
        status: "SUSPENDED" as const,
        titleIds: ["00000000-0000-4000-a000-000000000010"],
      };
      vi.mocked(mockTenantUserService.updateStatus).mockResolvedValue(updatedRecord);

      const response = await app.inject({
        method: "PATCH",
        url: "/api/v1/tenant-users/00000000-0000-4000-a000-000000000099/status",
        cookies: { vlxd_session: "valid-token" },
        payload: {
          status: "SUSPENDED",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(updatedRecord);
    });

    it("returns 400 on invalid status enum value", async () => {
      const app = buildTestApp(mockAuthService, mockAuthorizationService, mockTenantUserService);
      vi.mocked(mockAuthService.validateSession).mockResolvedValue(validSession);
      vi.mocked(mockAuthorizationService.require).mockResolvedValue();

      const response = await app.inject({
        method: "PATCH",
        url: "/api/v1/tenant-users/00000000-0000-4000-a000-000000000099/status",
        cookies: { vlxd_session: "valid-token" },
        payload: {
          status: "INVALID_STATUS",
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("PUT /api/v1/tenant-users/:tenantUserId/titles", () => {
    it("returns 200 on valid title replacement", async () => {
      const app = buildTestApp(mockAuthService, mockAuthorizationService, mockTenantUserService);
      vi.mocked(mockAuthService.validateSession).mockResolvedValue(validSession);
      vi.mocked(mockAuthorizationService.require).mockResolvedValue();

      const updatedRecord = {
        id: "00000000-0000-4000-a000-000000000099",
        tenantId: "00000000-0000-4000-a000-000000000001",
        userId: "00000000-0000-4000-a000-000000000002",
        email: "staff@example.com",
        fullName: "Staff Member",
        status: "ACTIVE" as const,
        titleIds: ["00000000-0000-4000-a000-000000000020"],
      };
      vi.mocked(mockTenantUserService.replaceTitles).mockResolvedValue(updatedRecord);

      const response = await app.inject({
        method: "PUT",
        url: "/api/v1/tenant-users/00000000-0000-4000-a000-000000000099/titles",
        cookies: { vlxd_session: "valid-token" },
        payload: {
          titleIds: ["00000000-0000-4000-a000-000000000020"],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(updatedRecord);
    });
  });
});
