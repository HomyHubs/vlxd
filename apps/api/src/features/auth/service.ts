import { AppError, ErrorCode } from "@vlxd/shared";
import { generateSessionToken, hashSessionToken, verifyPassword } from "./crypto.js";
import type { AuthRepository } from "./repository.js";
import type { AuthMeResponse, LoginRequest, LoginResponse, LogoutResponse } from "./schema.js";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface LoginContext {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

export class AuthService {
  constructor(private readonly repo: AuthRepository) {}

  async login(payload: LoginRequest, ctx: LoginContext = {}): Promise<LoginResponse> {
    const email = payload.email.toLowerCase().trim();
    const user = await this.repo.findUserByEmail(email);

    if (!user) {
      throw new AppError("Invalid email or password", ErrorCode.INVALID_CREDENTIALS, 401);
    }

    const isValidPassword = await verifyPassword(payload.password, user.password_hash);
    if (!isValidPassword) {
      // Find a candidate tenant to record failed audit log if possible
      const candidateTenant = await this.repo.findDefaultTenantForUser(user.id);
      if (candidateTenant) {
        await this.repo.createAuditLog({
          tenantId: candidateTenant.id,
          actorId: user.id,
          actorEmail: user.email,
          action: "AUTH_LOGIN_FAILED",
          entityType: "user",
          entityId: user.id,
          beforeState: null,
          afterState: { reason: "INVALID_PASSWORD" },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
        });
      }
      throw new AppError("Invalid email or password", ErrorCode.INVALID_CREDENTIALS, 401);
    }

    // Check User Status
    if (user.status === "BLOCKED") {
      throw new AppError("User account is blocked", ErrorCode.USER_SUSPENDED, 403);
    }
    if (user.status === "INACTIVE" || user.status === "ARCHIVED") {
      throw new AppError("User account is inactive", ErrorCode.USER_SUSPENDED, 403);
    }

    // Resolve Tenant
    let tenant;
    if (payload.tenantCode) {
      tenant = await this.repo.findTenantByCode(payload.tenantCode);
      if (!tenant) {
        throw new AppError("Tenant not found", ErrorCode.TENANT_NOT_FOUND, 404);
      }
    } else {
      tenant = await this.repo.findDefaultTenantForUser(user.id);
      if (!tenant) {
        throw new AppError("No tenant assigned to this user", ErrorCode.FORBIDDEN, 403);
      }
    }

    // Check Tenant Status
    if (tenant.status === "SUSPENDED" || tenant.status === "ARCHIVED") {
      throw new AppError("Tenant account is suspended", ErrorCode.TENANT_SUSPENDED, 403);
    }

    // Check Tenant User Membership
    const tenantUser = await this.repo.findTenantUser(tenant.id, user.id);
    if (!tenantUser || tenantUser.status !== "ACTIVE") {
      throw new AppError("User is not active in this tenant", ErrorCode.FORBIDDEN, 403);
    }

    // Create Opaque Session
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const session = await this.repo.createSession({
      tokenHash,
      userId: user.id,
      tenantId: tenant.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      expiresAt,
    });

    // Record Successful Audit Log
    await this.repo.createAuditLog({
      tenantId: tenant.id,
      actorId: user.id,
      actorEmail: user.email,
      action: "AUTH_LOGIN_SUCCESS",
      entityType: "session",
      entityId: session.id,
      beforeState: null,
      afterState: {
        sessionId: session.id,
        userId: user.id,
        tenantId: tenant.id,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
        status: user.status,
      },
      tenant: {
        id: tenant.id,
        code: tenant.code,
        name: tenant.name,
        status: tenant.status,
      },
      session: {
        id: session.id,
        expiresAt: new Date(session.expires_at).toISOString(),
        createdAt: new Date(session.created_at).toISOString(),
      },
      token: rawToken,
    };
  }

  async logout(
    sessionId: string,
    tenantId: string,
    actorId: string,
    actorEmail: string,
    ctx: LoginContext = {},
  ): Promise<LogoutResponse> {
    await this.repo.revokeSession(sessionId);

    await this.repo.createAuditLog({
      tenantId,
      actorId,
      actorEmail,
      action: "AUTH_LOGOUT",
      entityType: "session",
      entityId: sessionId,
      beforeState: null,
      afterState: { sessionId, revokedAt: new Date().toISOString() },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
    });

    return {
      success: true,
      message: "Logout successful",
    };
  }

  async getAuthMe(userId: string, tenantId: string, sessionId: string): Promise<AuthMeResponse> {
    const user = await this.repo.findUserById(userId);
    if (!user || user.status !== "ACTIVE") {
      throw new AppError("User not found or inactive", ErrorCode.UNAUTHORIZED, 401);
    }

    const tenant = await this.repo.findTenantById(tenantId);
    if (!tenant || tenant.status !== "ACTIVE") {
      throw new AppError("Tenant not found or suspended", ErrorCode.UNAUTHORIZED, 401);
    }

    const tenantUser = await this.repo.findTenantUser(tenant.id, user.id);
    if (!tenantUser || tenantUser.status !== "ACTIVE") {
      throw new AppError("User membership in tenant is invalid", ErrorCode.UNAUTHORIZED, 401);
    }

    const titlesData = await this.repo.findUserTitles(tenantUser.id);
    const titles = titlesData.map((t) => ({
      id: t.title_id,
      code: t.title_code,
      name: t.title_name,
      roleGroup: {
        id: t.role_group_id,
        code: t.role_group_code,
        name: t.role_group_name,
      },
    }));

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
        status: user.status,
      },
      tenant: {
        id: tenant.id,
        code: tenant.code,
        name: tenant.name,
        status: tenant.status,
      },
      session: {
        id: sessionId,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      },
      isOwner: Boolean(tenantUser.is_owner),
      titles,
    };
  }

  async validateSession(rawToken: string) {
    if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length === 0) {
      throw new AppError("Authentication credentials missing", ErrorCode.UNAUTHORIZED, 401);
    }

    const tokenHash = hashSessionToken(rawToken.trim());
    const session = await this.repo.findSessionByTokenHash(tokenHash);

    if (!session) {
      throw new AppError("Invalid or expired session", ErrorCode.UNAUTHORIZED, 401);
    }

    const user = await this.repo.findUserById(session.user_id);
    if (!user || user.status !== "ACTIVE") {
      throw new AppError("User account is inactive or blocked", ErrorCode.USER_SUSPENDED, 403);
    }

    const tenant = await this.repo.findTenantById(session.tenant_id);
    if (!tenant || tenant.status !== "ACTIVE") {
      throw new AppError("Tenant account is suspended", ErrorCode.TENANT_SUSPENDED, 403);
    }

    const tenantUser = await this.repo.findTenantUser(tenant.id, user.id);
    if (!tenantUser || tenantUser.status !== "ACTIVE") {
      throw new AppError("User membership in tenant is revoked", ErrorCode.UNAUTHORIZED, 401);
    }

    // Fire & forget last seen update
    this.repo.updateSessionLastSeen(session.id).catch(() => {});

    return {
      session,
      user,
      tenant,
      tenantUser,
    };
  }
}
