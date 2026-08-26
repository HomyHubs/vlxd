import { PostgreSqlContainer } from "@testcontainers/postgresql";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../../platform/db/index.js";
import { KyselyTenantUserRepository } from "../repository.js";

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../../../db/migrations",
);

describe("KyselyTenantUserRepository PostgreSQL integration", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>> | undefined;
  let pool: Pool | undefined;
  let db: Kysely<Database> | undefined;
  let hasContainer = false;

  beforeAll(async () => {
    try {
      container = await new PostgreSqlContainer("postgres:16-alpine").start();
    } catch (err) {
      if (process.env.CI) {
        throw new Error(
          `Testcontainers PostgreSQL startup failed in CI: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      hasContainer = false;
      return;
    }

    pool = new Pool({ connectionString: container.getConnectionUri() });
    db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) });

    for (const migration of [
      "20260823000001_create_identity_and_tenancy.sql",
      "20260823000002_create_permissions_and_roles.sql",
    ]) {
      const sql = await fs.readFile(path.join(migrationsDir, migration), "utf8");
      const upSql = sql.split("-- migrate:down")[0];
      if (!upSql) throw new Error(`Migration has no up section: ${migration}`);
      await pool.query(upSql);
    }

    await pool.query(`
      INSERT INTO tenants (id, code, name) VALUES
        ('00000000-0000-4000-a000-000000000001', 'TENANT_A', 'Tenant A'),
        ('00000000-0000-4000-a000-000000000002', 'TENANT_B', 'Tenant B');
      INSERT INTO users (id, email, full_name, password_hash) VALUES
        ('00000000-0000-4000-a000-000000000010', 'active@example.com', 'Active User', 'hash'),
        ('00000000-0000-4000-a000-000000000011', 'archived@example.com', 'Archived User', 'hash');
      UPDATE users SET archived_at = now() WHERE id = '00000000-0000-4000-a000-000000000011';

      INSERT INTO role_groups (id, code, name) VALUES
        ('00000000-0000-4000-a000-000000000020', 'ADMIN_ROLE', 'Admin Role');

      INSERT INTO titles (id, tenant_id, code, name, role_group_id) VALUES
        ('00000000-0000-4000-a000-000000000030', NULL, 'SYSTEM_TITLE', 'System Title', '00000000-0000-4000-a000-000000000020'),
        ('00000000-0000-4000-a000-000000000031', '00000000-0000-4000-a000-000000000001', 'TENANT_A_TITLE', 'Tenant A Title', '00000000-0000-4000-a000-000000000020'),
        ('00000000-0000-4000-a000-000000000032', '00000000-0000-4000-a000-000000000002', 'TENANT_B_TITLE', 'Tenant B Title', '00000000-0000-4000-a000-000000000020');
    `);
    hasContainer = true;
  }, 120_000);

  afterAll(async () => {
    await db?.destroy();
    await container?.stop();
  });

  it("finds active users by email and filters archived users", async (ctx) => {
    if (!hasContainer || !db) {
      ctx.skip();
      return;
    }
    const repository = new KyselyTenantUserRepository(db);

    const activeUser = await repository.findUserByEmail("ACTIVE@EXAMPLE.COM");
    expect(activeUser).toEqual({
      id: "00000000-0000-4000-a000-000000000010",
      email: "active@example.com",
      fullName: "Active User",
    });

    const archivedUser = await repository.findUserByEmail("archived@example.com");
    expect(archivedUser).toBeNull();
  });

  it("enforces tenant-specific title boundaries and allows system titles", async (ctx) => {
    if (!hasContainer || !db) {
      ctx.skip();
      return;
    }
    const repository = new KyselyTenantUserRepository(db);

    const tenantATitles = await repository.findTitleIds("00000000-0000-4000-a000-000000000001", [
      "00000000-0000-4000-a000-000000000030",
      "00000000-0000-4000-a000-000000000031",
      "00000000-0000-4000-a000-000000000032",
    ]);

    expect(tenantATitles).toHaveLength(2);
    expect(tenantATitles).toContain("00000000-0000-4000-a000-000000000030");
    expect(tenantATitles).toContain("00000000-0000-4000-a000-000000000031");
    expect(tenantATitles).not.toContain("00000000-0000-4000-a000-000000000032");
  });

  it("creates tenant user, assigns titles, and translates duplicate unique constraint into 409 CONFLICT", async (ctx) => {
    if (!hasContainer || !db) {
      ctx.skip();
      return;
    }
    const repository = new KyselyTenantUserRepository(db);

    const record = await repository.createTenantUser({
      tenantId: "00000000-0000-4000-a000-000000000001",
      userId: "00000000-0000-4000-a000-000000000010",
      titleIds: ["00000000-0000-4000-a000-000000000030", "00000000-0000-4000-a000-000000000031"],
    });

    expect(record).toMatchObject({
      tenantId: "00000000-0000-4000-a000-000000000001",
      userId: "00000000-0000-4000-a000-000000000010",
      status: "ACTIVE",
    });
    expect(record.titleIds).toHaveLength(2);

    await expect(
      repository.createTenantUser({
        tenantId: "00000000-0000-4000-a000-000000000001",
        userId: "00000000-0000-4000-a000-000000000010",
        titleIds: ["00000000-0000-4000-a000-000000000030"],
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      statusCode: 409,
    });
  });

  it("updates membership status and replaces titles atomically", async (ctx) => {
    if (!hasContainer || !db) {
      ctx.skip();
      return;
    }
    const repository = new KyselyTenantUserRepository(db);

    const membership = await repository.findTenantMembershipByUserId(
      "00000000-0000-4000-a000-000000000001",
      "00000000-0000-4000-a000-000000000010",
    );
    expect(membership).not.toBeNull();
    const tenantUserId = membership!.id;

    const updatedStatus = await repository.updateStatus(
      "00000000-0000-4000-a000-000000000001",
      tenantUserId,
      "SUSPENDED",
    );
    expect(updatedStatus?.status).toBe("SUSPENDED");

    const replaced = await repository.replaceTitles(
      "00000000-0000-4000-a000-000000000001",
      tenantUserId,
      ["00000000-0000-4000-a000-000000000030"],
    );
    expect(replaced?.titleIds).toEqual(["00000000-0000-4000-a000-000000000030"]);
  });
});
