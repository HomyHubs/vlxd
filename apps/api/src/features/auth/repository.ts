import type { Kysely } from "kysely";
import type { Database } from "../../platform/db/index.js";

export interface CreateSessionParams {
  tokenHash: string;
  userId: string;
  tenantId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
}

export interface CreateAuditLogParams {
  tenantId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

export interface UserProfileWithTitles {
  user: {
    id: string;
    email: string;
    phone: string | null;
    fullName: string;
    status: string;
  };
  tenant: {
    id: string;
    code: string;
    name: string;
    status: string;
  };
  tenantUser: {
    id: string;
    isOwner: boolean;
    status: string;
  };
  titles: Array<{
    id: string;
    code: string;
    name: string;
    roleGroup: {
      id: string;
      code: string;
      name: string;
    };
  }>;
}

export class AuthRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findUserByEmail(email: string) {
    return this.db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email.toLowerCase().trim())
      .where("archived_at", "is", null)
      .executeTakeFirst();
  }

  async findUserById(id: string) {
    return this.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .where("archived_at", "is", null)
      .executeTakeFirst();
  }

  async findTenantByCode(code: string) {
    return this.db
      .selectFrom("tenants")
      .selectAll()
      .where("code", "=", code.toUpperCase().trim())
      .where("archived_at", "is", null)
      .executeTakeFirst();
  }

  async findTenantById(id: string) {
    return this.db
      .selectFrom("tenants")
      .selectAll()
      .where("id", "=", id)
      .where("archived_at", "is", null)
      .executeTakeFirst();
  }

  async findTenantUser(tenantId: string, userId: string) {
    return this.db
      .selectFrom("tenant_users")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .where("user_id", "=", userId)
      .where("archived_at", "is", null)
      .executeTakeFirst();
  }

  async findDefaultTenantForUser(userId: string) {
    return this.db
      .selectFrom("tenant_users")
      .innerJoin("tenants", "tenants.id", "tenant_users.tenant_id")
      .selectAll("tenants")
      .where("tenant_users.user_id", "=", userId)
      .where("tenant_users.archived_at", "is", null)
      .where("tenants.archived_at", "is", null)
      .orderBy("tenant_users.is_owner", "desc")
      .orderBy("tenant_users.created_at", "asc")
      .executeTakeFirst();
  }

  async findUserTitles(tenantUserId: string) {
    return this.db
      .selectFrom("tenant_user_titles")
      .innerJoin("titles", "titles.id", "tenant_user_titles.title_id")
      .innerJoin("role_groups", "role_groups.id", "titles.role_group_id")
      .select([
        "titles.id as title_id",
        "titles.code as title_code",
        "titles.name as title_name",
        "role_groups.id as role_group_id",
        "role_groups.code as role_group_code",
        "role_groups.name as role_group_name",
      ])
      .where("tenant_user_titles.tenant_user_id", "=", tenantUserId)
      .where("titles.archived_at", "is", null)
      .where("role_groups.archived_at", "is", null)
      .execute();
  }

  async createSession(params: CreateSessionParams) {
    return this.db
      .insertInto("sessions")
      .values({
        token_hash: params.tokenHash,
        user_id: params.userId,
        tenant_id: params.tenantId,
        ip_address: params.ipAddress ?? null,
        user_agent: params.userAgent ?? null,
        expires_at: params.expiresAt,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findSessionByTokenHash(tokenHash: string) {
    return this.db
      .selectFrom("sessions")
      .selectAll()
      .where("token_hash", "=", tokenHash)
      .where("revoked_at", "is", null)
      .where("expires_at", ">", new Date())
      .executeTakeFirst();
  }

  async updateSessionLastSeen(sessionId: string) {
    await this.db
      .updateTable("sessions")
      .set({ last_seen_at: new Date() })
      .where("id", "=", sessionId)
      .execute();
  }

  async revokeSession(sessionId: string) {
    await this.db
      .updateTable("sessions")
      .set({ revoked_at: new Date() })
      .where("id", "=", sessionId)
      .where("revoked_at", "is", null)
      .execute();
  }

  async revokeAllUserSessions(userId: string) {
    await this.db
      .updateTable("sessions")
      .set({ revoked_at: new Date() })
      .where("user_id", "=", userId)
      .where("revoked_at", "is", null)
      .execute();
  }

  async createAuditLog(params: CreateAuditLogParams) {
    return this.db
      .insertInto("audit_logs")
      .values({
        tenant_id: params.tenantId,
        actor_id: params.actorId ?? null,
        actor_email: params.actorEmail ?? null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        before_state: params.beforeState ? JSON.stringify(params.beforeState) : null,
        after_state: params.afterState ? JSON.stringify(params.afterState) : null,
        ip_address: params.ipAddress ?? null,
        user_agent: params.userAgent ?? null,
        request_id: params.requestId ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
