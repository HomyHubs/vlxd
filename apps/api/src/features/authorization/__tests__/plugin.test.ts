import Fastify from "fastify";
import { authPlugin, type AuthService } from "../../auth/index.js";
import { registerErrorHandlers } from "../../../platform/http/error-handler.js";
import { describe, expect, it } from "vitest";
import {
  AuthorizationService,
  authorizationPlugin,
  type AuthorizationRepository,
} from "../index.js";

function buildApp(service: AuthorizationService) {
  const app = Fastify();
  const authService = {
    validateSession: async () => ({
      session: { id: "session-1", expires_at: new Date("2030-01-01T00:00:00.000Z") },
      user: {
        id: "user-1",
        email: "user@example.com",
        full_name: "User",
        status: "ACTIVE",
      },
      tenant: {
        id: "tenant-1",
        code: "TENANT",
        name: "Tenant",
        status: "ACTIVE",
      },
      tenantUser: { id: "tenant-user-1" },
    }),
  } as unknown as AuthService;

  app.register(authPlugin, { authService });
  app.register(authorizationPlugin, { authorizationService: service });
  registerErrorHandlers(app);
  app.register(async (scopedApp) => {
    scopedApp.get(
      "/protected",
      { preHandler: [scopedApp.requirePermission("product.item.read")] },
      async () => ({ ok: true }),
    );
  });
  return app;
}

describe("authorization Fastify plugin", () => {
  it("rejects unauthenticated requests before evaluating a capability", async () => {
    const repository: AuthorizationRepository = {
      findRolePermissionCodes: async () => ["product.item.read"],
      findTenantPermissionOverrides: async () => [],
    };
    const app = buildApp(new AuthorizationService(repository));

    const response = await app.inject({ method: "GET", url: "/protected" });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("UNAUTHORIZED");
  });

  it("rejects an authenticated request without the capability", async () => {
    const repository: AuthorizationRepository = {
      findRolePermissionCodes: async () => [],
      findTenantPermissionOverrides: async () => [],
    };
    const app = buildApp(new AuthorizationService(repository));

    const response = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("FORBIDDEN");
  });

  it("authenticates a valid credential before allowing a capability", async () => {
    const repository: AuthorizationRepository = {
      findRolePermissionCodes: async () => ["product.item.read"],
      findTenantPermissionOverrides: async () => [],
    };
    const app = buildApp(new AuthorizationService(repository));

    const response = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });
});
