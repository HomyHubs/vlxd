import { describe, expect, it } from "vitest";
import { AuthorizationService, type AuthorizationRepository } from "../index.js";

function buildService(data: {
  rolePermissions?: string[];
  overrides?: Array<{ code: string; effect: "ALLOW" | "DENY" }>;
}) {
  const repository: AuthorizationRepository = {
    findRolePermissionCodes: async () => data.rolePermissions ?? [],
    findTenantPermissionOverrides: async () => data.overrides ?? [],
  };

  return new AuthorizationService(repository);
}

describe("AuthorizationService", () => {
  it("allows a capability granted through the user's role group", async () => {
    const service = buildService({ rolePermissions: ["product.item.read"] });

    await expect(
      service.authorize({ userId: "user-1", tenantId: "tenant-1" }, "product.item.read"),
    ).resolves.toEqual({ allowed: true, reason: "ROLE_GROUP" });
  });

  it("allows a capability granted by a tenant-level custom override", async () => {
    const service = buildService({
      overrides: [{ code: "product.item.update", effect: "ALLOW" }],
    });

    await expect(
      service.authorize({ userId: "user-1", tenantId: "tenant-1" }, "product.item.update"),
    ).resolves.toEqual({ allowed: true, reason: "CUSTOM_ALLOW" });
  });

  it("denies when a custom DENY conflicts with a role ALLOW", async () => {
    const service = buildService({
      rolePermissions: ["product.item.archive"],
      overrides: [{ code: "product.item.archive", effect: "DENY" }],
    });

    await expect(
      service.authorize({ userId: "user-1", tenantId: "tenant-1" }, "product.item.archive"),
    ).resolves.toEqual({ allowed: false, reason: "CUSTOM_DENY" });
  });

  it("denies unknown capabilities by default", async () => {
    const service = buildService({});

    await expect(
      service.authorize({ userId: "user-1", tenantId: "tenant-1" }, "unknown.capability"),
    ).resolves.toEqual({ allowed: false, reason: "NO_GRANT" });
  });
});
