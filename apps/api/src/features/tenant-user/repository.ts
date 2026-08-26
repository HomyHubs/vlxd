import { AppError, ErrorCode } from "@vlxd/shared";
import type { Kysely } from "kysely";
import type { Database } from "../../platform/db/index.js";

export interface TenantUserRecord {
  id: string;
  tenantId: string;
  userId: string;
  email: string;
  fullName: string;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  titleIds: string[];
}

export interface TenantUserRepository {
  findUserByEmail(email: string): Promise<{ id: string; email: string; fullName: string } | null>;
  findTenantMembershipByUserId(
    tenantId: string,
    userId: string,
  ): Promise<{ id: string; status: string } | null>;
  findTenantUserById(
    tenantId: string,
    tenantUserId: string,
  ): Promise<{ id: string; status: string } | null>;
  findTitleIds(tenantId: string, titleIds: string[]): Promise<string[]>;
  createTenantUser(input: {
    tenantId: string;
    userId: string;
    titleIds: string[];
  }): Promise<TenantUserRecord>;
  updateStatus(
    tenantId: string,
    tenantUserId: string,
    status: TenantUserRecord["status"],
  ): Promise<TenantUserRecord | null>;
  replaceTitles(
    tenantId: string,
    tenantUserId: string,
    titleIds: string[],
  ): Promise<TenantUserRecord | null>;
}

export class KyselyTenantUserRepository implements TenantUserRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findUserByEmail(email: string) {
    const user = await this.db
      .selectFrom("users")
      .select(["id", "email", "full_name"])
      .where("email", "=", email.toLowerCase().trim())
      .where("archived_at", "is", null)
      .executeTakeFirst();
    return user ? { id: user.id, email: user.email, fullName: user.full_name } : null;
  }

  async findTenantMembershipByUserId(tenantId: string, userId: string) {
    return (
      (await this.db
        .selectFrom("tenant_users")
        .select(["id", "status"])
        .where("user_id", "=", userId)
        .where("tenant_id", "=", tenantId)
        .where("archived_at", "is", null)
        .executeTakeFirst()) ?? null
    );
  }

  async findTenantUserById(tenantId: string, tenantUserId: string) {
    return (
      (await this.db
        .selectFrom("tenant_users")
        .select(["id", "status"])
        .where("id", "=", tenantUserId)
        .where("tenant_id", "=", tenantId)
        .where("archived_at", "is", null)
        .executeTakeFirst()) ?? null
    );
  }

  async findTitleIds(tenantId: string, titleIds: string[]) {
    if (titleIds.length === 0) return [];
    const rows = await this.db
      .selectFrom("titles")
      .select("id")
      .where("id", "in", titleIds)
      .where("archived_at", "is", null)
      .where((eb) => eb.or([eb("tenant_id", "is", null), eb("tenant_id", "=", tenantId)]))
      .execute();
    return rows.map((row) => row.id);
  }

  async createTenantUser(input: { tenantId: string; userId: string; titleIds: string[] }) {
    try {
      return await this.db.transaction().execute(async (trx) => {
        const membership = await trx
          .insertInto("tenant_users")
          .values({
            tenant_id: input.tenantId,
            user_id: input.userId,
            status: "ACTIVE",
            is_owner: false,
          })
          .returning(["id", "tenant_id", "user_id", "status"])
          .executeTakeFirstOrThrow();

        const uniqueTitleIds = Array.from(new Set(input.titleIds));
        if (uniqueTitleIds.length > 0) {
          await trx
            .insertInto("tenant_user_titles")
            .values(
              uniqueTitleIds.map((titleId) => ({
                tenant_user_id: membership.id,
                title_id: titleId,
              })),
            )
            .execute();
        }

        return this.getRecord(trx, input.tenantId, membership.id);
      });
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "23505"
      ) {
        throw new AppError("User is already a member of this tenant", ErrorCode.CONFLICT, 409);
      }
      throw err;
    }
  }

  async updateStatus(tenantId: string, tenantUserId: string, status: TenantUserRecord["status"]) {
    const result = await this.db
      .updateTable("tenant_users")
      .set({ status, updated_at: new Date() })
      .where("id", "=", tenantUserId)
      .where("tenant_id", "=", tenantId)
      .where("archived_at", "is", null)
      .returning("id")
      .executeTakeFirst();
    return result ? this.getRecord(this.db, tenantId, tenantUserId) : null;
  }

  async replaceTitles(tenantId: string, tenantUserId: string, titleIds: string[]) {
    return this.db.transaction().execute(async (trx) => {
      const membership = await trx
        .selectFrom("tenant_users")
        .select(["id", "status"])
        .where("id", "=", tenantUserId)
        .where("tenant_id", "=", tenantId)
        .where("archived_at", "is", null)
        .forUpdate()
        .executeTakeFirst();

      if (!membership) return null;

      await trx
        .deleteFrom("tenant_user_titles")
        .where("tenant_user_id", "=", tenantUserId)
        .execute();

      const uniqueTitleIds = Array.from(new Set(titleIds));
      if (uniqueTitleIds.length > 0) {
        await trx
          .insertInto("tenant_user_titles")
          .values(
            uniqueTitleIds.map((titleId) => ({
              tenant_user_id: tenantUserId,
              title_id: titleId,
            })),
          )
          .execute();
      }

      return this.getRecord(trx, tenantId, tenantUserId);
    });
  }

  private async getRecord(db: Kysely<Database>, tenantId: string, tenantUserId: string) {
    const row = await db
      .selectFrom("tenant_users")
      .innerJoin("users", "users.id", "tenant_users.user_id")
      .select([
        "tenant_users.id",
        "tenant_users.tenant_id",
        "tenant_users.user_id",
        "tenant_users.status",
        "users.email",
        "users.full_name",
      ])
      .where("tenant_users.id", "=", tenantUserId)
      .where("tenant_users.tenant_id", "=", tenantId)
      .executeTakeFirstOrThrow();
    const titles = await db
      .selectFrom("tenant_user_titles")
      .select("title_id")
      .where("tenant_user_id", "=", tenantUserId)
      .execute();
    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      email: row.email,
      fullName: row.full_name,
      status: row.status,
      titleIds: titles.map((title) => title.title_id),
    };
  }
}
