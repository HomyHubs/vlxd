import { ErrorCode } from "@vlxd/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword, hashSessionToken } from "../crypto.js";
import type { AuthRepository } from "../repository.js";
import { AuthService } from "../service.js";

describe("AuthService", () => {
  let authService: AuthService;
  let mockRepo: { [K in keyof AuthRepository]: ReturnType<typeof vi.fn> };

  const validPassword = "SecurePassword@2026";
  let validPasswordHash: string;

  beforeEach(async () => {
    validPasswordHash = await hashPassword(validPassword);

    mockRepo = {
      findUserByEmail: vi.fn(),
      findUserById: vi.fn(),
      findTenantByCode: vi.fn(),
      findTenantById: vi.fn(),
      findTenantUser: vi.fn(),
      findDefaultTenantForUser: vi.fn(),
      findUserTitles: vi.fn(),
      createSession: vi.fn(),
      findSessionByTokenHash: vi.fn(),
      updateSessionLastSeen: vi.fn(),
      revokeSession: vi.fn(),
      revokeAllUserSessions: vi.fn(),
      createAuditLog: vi.fn(),
    } as unknown as { [K in keyof AuthRepository]: ReturnType<typeof vi.fn> };

    authService = new AuthService(mockRepo as unknown as AuthRepository);
  });

  describe("login()", () => {
    const mockUser = {
      id: "user-123",
      email: "admin@vlxd.vn",
      phone: "+84901234567",
      full_name: "Quản Trị Viên",
      password_hash: "",
      status: "ACTIVE",
      created_at: new Date(),
      updated_at: new Date(),
      archived_at: null,
    };

    const mockTenant = {
      id: "tenant-456",
      code: "VLXD-HN",
      name: "VLXD Hà Nội",
      status: "ACTIVE",
      tax_code: null,
      phone: null,
      email: null,
      address: null,
      settings: {},
      created_at: new Date(),
      updated_at: new Date(),
      archived_at: null,
    };

    const mockTenantUser = {
      id: "tu-789",
      tenant_id: "tenant-456",
      user_id: "user-123",
      status: "ACTIVE",
      is_owner: true,
      created_at: new Date(),
      updated_at: new Date(),
      archived_at: null,
    };

    it("logs in successfully with default tenant and returns LoginResponse", async () => {
      mockUser.password_hash = validPasswordHash;

      mockRepo.findUserByEmail.mockResolvedValue(mockUser);
      mockRepo.findDefaultTenantForUser.mockResolvedValue(mockTenant);
      mockRepo.findTenantUser.mockResolvedValue(mockTenantUser);
      mockRepo.createSession.mockResolvedValue({
        id: "sess-999",
        token_hash: "hash-xyz",
        user_id: mockUser.id,
        tenant_id: mockTenant.id,
        ip_address: "127.0.0.1",
        user_agent: "Mozilla/5.0",
        expires_at: new Date(Date.now() + 7 * 86400000),
        created_at: new Date(),
        last_seen_at: new Date(),
        revoked_at: null,
      });

      const response = await authService.login(
        {
          email: "admin@vlxd.vn",
          password: validPassword,
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0",
          requestId: "req-1",
        },
      );

      expect(response.user.id).toBe(mockUser.id);
      expect(response.user.email).toBe(mockUser.email);
      expect(response.tenant.id).toBe(mockTenant.id);
      expect(response.tenant.code).toBe(mockTenant.code);
      expect(response.session.id).toBe("sess-999");
      expect(response.token).toHaveLength(64);

      expect(mockRepo.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenant.id,
          actorId: mockUser.id,
          action: "AUTH_LOGIN_SUCCESS",
          entityType: "session",
          entityId: "sess-999",
        }),
      );
    });

    it("logs in with explicit tenant code", async () => {
      mockUser.password_hash = validPasswordHash;

      mockRepo.findUserByEmail.mockResolvedValue(mockUser);
      mockRepo.findTenantByCode.mockResolvedValue(mockTenant);
      mockRepo.findTenantUser.mockResolvedValue(mockTenantUser);
      mockRepo.createSession.mockResolvedValue({
        id: "sess-999",
        token_hash: "hash-xyz",
        user_id: mockUser.id,
        tenant_id: mockTenant.id,
        ip_address: null,
        user_agent: null,
        expires_at: new Date(),
        created_at: new Date(),
        last_seen_at: new Date(),
        revoked_at: null,
      });

      const response = await authService.login({
        email: "admin@vlxd.vn",
        password: validPassword,
        tenantCode: "VLXD-HN",
      });

      expect(response.tenant.code).toBe("VLXD-HN");
      expect(mockRepo.findTenantByCode).toHaveBeenCalledWith("VLXD-HN");
    });

    it("throws 401 INVALID_CREDENTIALS when user email does not exist", async () => {
      mockRepo.findUserByEmail.mockResolvedValue(undefined);

      await expect(
        authService.login({
          email: "unknown@vlxd.vn",
          password: "any-password",
        }),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: ErrorCode.INVALID_CREDENTIALS,
      });
    });

    it("throws 401 INVALID_CREDENTIALS on wrong password and logs failed attempt", async () => {
      mockUser.password_hash = validPasswordHash;
      mockRepo.findUserByEmail.mockResolvedValue(mockUser);
      mockRepo.findDefaultTenantForUser.mockResolvedValue(mockTenant);

      await expect(
        authService.login({
          email: "admin@vlxd.vn",
          password: "WrongPassword123",
        }),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: ErrorCode.INVALID_CREDENTIALS,
      });

      expect(mockRepo.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenant.id,
          actorId: mockUser.id,
          action: "AUTH_LOGIN_FAILED",
        }),
      );
    });

    it("throws 403 USER_SUSPENDED when user is blocked", async () => {
      const blockedUser = { ...mockUser, password_hash: validPasswordHash, status: "BLOCKED" };
      mockRepo.findUserByEmail.mockResolvedValue(blockedUser);

      await expect(
        authService.login({
          email: "admin@vlxd.vn",
          password: validPassword,
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: ErrorCode.USER_SUSPENDED,
      });
    });

    it("throws 403 TENANT_SUSPENDED when tenant is suspended", async () => {
      mockUser.password_hash = validPasswordHash;
      const suspendedTenant = { ...mockTenant, status: "SUSPENDED" };

      mockRepo.findUserByEmail.mockResolvedValue(mockUser);
      mockRepo.findDefaultTenantForUser.mockResolvedValue(suspendedTenant);

      await expect(
        authService.login({
          email: "admin@vlxd.vn",
          password: validPassword,
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: ErrorCode.TENANT_SUSPENDED,
      });
    });

    it("throws 403 FORBIDDEN when user is not active in tenant", async () => {
      mockUser.password_hash = validPasswordHash;

      mockRepo.findUserByEmail.mockResolvedValue(mockUser);
      mockRepo.findDefaultTenantForUser.mockResolvedValue(mockTenant);
      mockRepo.findTenantUser.mockResolvedValue(null);

      await expect(
        authService.login({
          email: "admin@vlxd.vn",
          password: validPassword,
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: ErrorCode.FORBIDDEN,
      });
    });
  });

  describe("logout()", () => {
    it("revokes session and logs logout audit event", async () => {
      mockRepo.revokeSession.mockResolvedValue(undefined);
      mockRepo.createAuditLog.mockResolvedValue({ id: "audit-1" });

      const response = await authService.logout(
        "sess-123",
        "tenant-456",
        "user-789",
        "user@vlxd.vn",
        {
          ipAddress: "127.0.0.1",
          userAgent: "Vitest",
          requestId: "req-out",
        },
      );

      expect(response.success).toBe(true);
      expect(mockRepo.revokeSession).toHaveBeenCalledWith("sess-123");
      expect(mockRepo.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-456",
          actorId: "user-789",
          action: "AUTH_LOGOUT",
          entityType: "session",
          entityId: "sess-123",
        }),
      );
    });
  });

  describe("getAuthMe()", () => {
    it("returns active user, tenant, and titles list", async () => {
      mockRepo.findUserById.mockResolvedValue({
        id: "u-1",
        email: "boss@vlxd.vn",
        phone: null,
        full_name: "Giám Đốc",
        status: "ACTIVE",
      });

      mockRepo.findTenantById.mockResolvedValue({
        id: "t-1",
        code: "VLXD-HQ",
        name: "VLXD Trụ Sở",
        status: "ACTIVE",
      });

      mockRepo.findTenantUser.mockResolvedValue({
        id: "tu-1",
        tenant_id: "t-1",
        user_id: "u-1",
        is_owner: true,
        status: "ACTIVE",
      });

      mockRepo.findUserTitles.mockResolvedValue([
        {
          title_id: "title-1",
          title_code: "GDKD",
          title_name: "Giám đốc",
          role_group_id: "rg-1",
          role_group_code: "SUPER_ADMIN",
          role_group_name: "Super admin",
        },
      ]);

      const me = await authService.getAuthMe("u-1", "t-1", "sess-1");

      expect(me.user.email).toBe("boss@vlxd.vn");
      expect(me.tenant.code).toBe("VLXD-HQ");
      expect(me.isOwner).toBe(true);
      expect(me.titles).toHaveLength(1);
      expect(me.titles[0]?.roleGroup.code).toBe("SUPER_ADMIN");
    });
  });

  describe("validateSession()", () => {
    it("validates session token and returns context", async () => {
      const rawToken = "my-opaque-session-token";
      const tokenHash = hashSessionToken(rawToken);

      mockRepo.findSessionByTokenHash.mockResolvedValue({
        id: "sess-1",
        token_hash: tokenHash,
        user_id: "u-1",
        tenant_id: "t-1",
        expires_at: new Date(Date.now() + 100000),
      });

      mockRepo.findUserById.mockResolvedValue({
        id: "u-1",
        email: "u1@vlxd.vn",
        full_name: "User One",
        status: "ACTIVE",
      });

      mockRepo.findTenantById.mockResolvedValue({
        id: "t-1",
        code: "T1",
        name: "Tenant 1",
        status: "ACTIVE",
      });

      mockRepo.findTenantUser.mockResolvedValue({
        id: "tu-1",
        status: "ACTIVE",
        is_owner: false,
      });

      mockRepo.updateSessionLastSeen.mockResolvedValue(undefined);

      const result = await authService.validateSession(rawToken);

      expect(result.session.id).toBe("sess-1");
      expect(result.user.id).toBe("u-1");
      expect(result.tenant.id).toBe("t-1");
    });

    it("throws 401 UNAUTHORIZED for invalid session", async () => {
      mockRepo.findSessionByTokenHash.mockResolvedValue(undefined);

      await expect(authService.validateSession("invalid-token")).rejects.toMatchObject({
        statusCode: 401,
        code: ErrorCode.UNAUTHORIZED,
      });
    });

    it("throws 403 USER_SUSPENDED when session user is blocked", async () => {
      mockRepo.findSessionByTokenHash.mockResolvedValue({
        id: "sess-1",
        user_id: "u-1",
        tenant_id: "t-1",
        expires_at: new Date(Date.now() + 100000),
      });

      mockRepo.findUserById.mockResolvedValue({
        id: "u-1",
        status: "BLOCKED",
      });

      await expect(authService.validateSession("token")).rejects.toMatchObject({
        statusCode: 403,
        code: ErrorCode.USER_SUSPENDED,
      });
    });
  });
});
