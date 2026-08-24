import Fastify from "fastify";
import { registerErrorHandlers } from "../../../platform/http/error-handler.js";
import { describe, expect, it } from "vitest";
import {
  AuthorizationService,
  authorizationPlugin,
  type AuthorizationRepository,
} from "../index.js";

function buildApp(service: AuthorizationService) {
  const app = Fastify();
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
    app.decorateRequest("user", undefined);
    app.decorateRequest("tenant", undefined);
    app.addHook("onRequest", async (request) => {
      request.user = {
        id: "user-1",
        email: "user@example.com",
        fullName: "User",
        status: "ACTIVE",
      };
      request.tenant = { id: "tenant-1", code: "TENANT", name: "Tenant", status: "ACTIVE" };
    });

    const response = await app.inject({ method: "GET", url: "/protected" });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("FORBIDDEN");
  });
});
