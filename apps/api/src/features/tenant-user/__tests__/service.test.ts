import { describe, expect, it } from "vitest";
import { TenantUserService, type TenantUserRepository } from "../index.js";

function buildService(overrides: Partial<TenantUserRepository> = {}) {
  const repository: TenantUserRepository = {
    findUserByEmail: async () => null,
    findTenantMembershipByUserId: async () => null,
    findTenantUserById: async () => ({ id: "membership-1", status: "ACTIVE" }),
    findTitleIds: async (_tenantId, titleIds) => titleIds,
    createTenantUser: async (input) => ({
      id: "membership-1",
      tenantId: input.tenantId,
      userId: input.userId,
      email: "user@example.com",
      fullName: "User",
      status: "ACTIVE",
      titleIds: input.titleIds,
    }),
    updateStatus: async (_tenantId, _membershipId, status) => ({
      id: "membership-1",
      tenantId: "tenant-1",
      userId: "user-1",
      email: "user@example.com",
      fullName: "User",
      status,
      titleIds: ["title-1"],
    }),
    replaceTitles: async (_tenantId, _membershipId, titleIds) => ({
      id: "membership-1",
      tenantId: "tenant-1",
      userId: "user-1",
      email: "user@example.com",
      fullName: "User",
      status: "ACTIVE",
      titleIds,
    }),
    ...overrides,
  };
  return new TenantUserService(repository);
}

describe("TenantUserService", () => {
  it("invites an existing account and assigns its initial titles", async () => {
    const result = await buildService({
      findUserByEmail: async () => ({ id: "user-1", email: "user@example.com", fullName: "User" }),
    }).invite("tenant-1", { email: "USER@example.com", titleIds: ["title-1"] });

    expect(result).toMatchObject({ id: "membership-1", userId: "user-1", titleIds: ["title-1"] });
  });

  it("rejects a duplicate tenant membership", async () => {
    await expect(
      buildService({
        findUserByEmail: async () => ({
          id: "user-1",
          email: "user@example.com",
          fullName: "User",
        }),
        findTenantMembershipByUserId: async () => ({ id: "membership-1", status: "ACTIVE" }),
      }).invite("tenant-1", { email: "user@example.com", titleIds: ["title-1"] }),
    ).rejects.toMatchObject({ code: "CONFLICT", statusCode: 409 });
  });

  it("rejects title IDs that are not defined for the tenant", async () => {
    await expect(
      buildService({
        findUserByEmail: async () => ({
          id: "user-1",
          email: "user@example.com",
          fullName: "User",
        }),
        findTitleIds: async () => [],
      }).invite("tenant-1", { email: "user@example.com", titleIds: ["missing-title"] }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 });
  });

  it("delegates status changes and title replacement", async () => {
    const service = buildService();
    await expect(
      service.updateStatus("tenant-1", "membership-1", "SUSPENDED"),
    ).resolves.toMatchObject({
      status: "SUSPENDED",
    });
    await expect(
      service.replaceTitles("tenant-1", "membership-1", ["title-2"]),
    ).resolves.toMatchObject({
      titleIds: ["title-2"],
    });
  });
});
