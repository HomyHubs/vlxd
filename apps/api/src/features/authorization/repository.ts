import type { Kysely } from "kysely";
import type { Database } from "../../platform/db/index.js";

export interface PermissionOverride {
  code: string;
  effect: "ALLOW" | "DENY";
}

export interface AuthorizationRepository {
  findRolePermissionCodes(userId: string, tenantId: string): Promise<string[]>;
  findTenantPermissionOverrides(userId: string, tenantId: string): Promise<PermissionOverride[]>;
}

export class KyselyAuthorizationRepository implements AuthorizationRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findRolePermissionCodes(userId: string, tenantId: string): Promise<string[]> {
    const rows = await this.db
      .selectFrom("tenant_user_titles")
      .innerJoin("tenant_users", "tenant_users.id", "tenant_user_titles.tenant_user_id")
      .innerJoin("titles", "titles.id", "tenant_user_titles.title_id")
      .innerJoin(
        "role_group_permissions",
        "role_group_permissions.role_group_id",
        "titles.role_group_id",
      )
      .innerJoin("permissions", "permissions.id", "role_group_permissions.permission_id")
      .select("permissions.code")
      .where("tenant_users.user_id", "=", userId)
      .where("tenant_users.tenant_id", "=", tenantId)
      .where("tenant_users.status", "=", "ACTIVE")
      .where("tenant_users.archived_at", "is", null)
      .where("titles.archived_at", "is", null)
      .where((eb) =>
        eb.or([eb("titles.tenant_id", "is", null), eb("titles.tenant_id", "=", tenantId)]),
      )
      .execute();

    return rows.map((row) => row.code);
  }

  async findTenantPermissionOverrides(
    userId: string,
    tenantId: string,
  ): Promise<PermissionOverride[]> {
    const rows = await this.db
      .selectFrom("user_custom_permissions")
      .innerJoin("tenant_users", "tenant_users.id", "user_custom_permissions.tenant_user_id")
      .innerJoin("permissions", "permissions.id", "user_custom_permissions.permission_id")
      .select(["permissions.code", "user_custom_permissions.effect"])
      .where("tenant_users.user_id", "=", userId)
      .where("tenant_users.tenant_id", "=", tenantId)
      .where("tenant_users.status", "=", "ACTIVE")
      .where("tenant_users.archived_at", "is", null)
      .where("user_custom_permissions.scope_type", "=", "TENANT")
      .where("user_custom_permissions.scope_value", "is", null)
      .execute();

    return rows.map((row) => ({ code: row.code, effect: row.effect }));
  }
}
