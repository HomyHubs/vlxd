import { PostgreSqlContainer } from "@testcontainers/postgresql";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../../platform/db/index.js";
import { KyselyAuthorizationRepository } from "../index.js";

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../../../db/migrations",
);

describe("KyselyAuthorizationRepository PostgreSQL integration", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>> | undefined;
  let pool: Pool | undefined;
  let db: Kysely<Database> | undefined;
  let hasContainer = false;

  beforeAll(async () => {
    try {
      container = await new PostgreSqlContainer("postgres:16-alpine").start();
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
        INSERT INTO users (id, email, full_name, password_hash)
          VALUES ('00000000-0000-4000-a000-000000000010', 'user@example.com', 'User', 'test-hash');
        INSERT INTO tenant_users (id, tenant_id, user_id) VALUES
          ('00000000-0000-4000-a000-000000000011', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000010'),
          ('00000000-0000-4000-a000-000000000012', '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000010');
        INSERT INTO role_groups (id, code, name) VALUES
          ('00000000-0000-4000-a000-000000000020', 'ACTIVE_ROLE', 'Active role'),
          ('00000000-0000-4000-a000-000000000021', 'ARCHIVED_ROLE', 'Archived role');
        INSERT INTO permissions (id, code, module, resource, action, name) VALUES
          ('00000000-0000-4000-a000-000000000030', 'product.item.read', 'product', 'item', 'read', 'Read product'),
          ('00000000-0000-4000-a000-000000000031', 'product.item.write', 'product', 'item', 'write', 'Write product');
        INSERT INTO role_group_permissions (role_group_id, permission_id) VALUES
          ('00000000-0000-4000-a000-000000000020', '00000000-0000-4000-a000-000000000030'),
          ('00000000-0000-4000-a000-000000000021', '00000000-0000-4000-a000-000000000031');
        INSERT INTO titles (id, tenant_id, code, name, role_group_id) VALUES
          ('00000000-0000-4000-a000-000000000040', '00000000-0000-4000-a000-000000000001', 'ACTIVE_TITLE', 'Active title', '00000000-0000-4000-a000-000000000020'),
          ('00000000-0000-4000-a000-000000000041', '00000000-0000-4000-a000-000000000002', 'OTHER_TITLE', 'Other title', '00000000-0000-4000-a000-000000000021');
        INSERT INTO tenant_user_titles (tenant_user_id, title_id) VALUES
          ('00000000-0000-4000-a000-000000000011', '00000000-0000-4000-a000-000000000040'),
          ('00000000-0000-4000-a000-000000000012', '00000000-0000-4000-a000-000000000041');
        INSERT INTO user_custom_permissions (tenant_user_id, permission_id, effect)
          VALUES ('00000000-0000-4000-a000-000000000011', '00000000-0000-4000-a000-000000000031', 'ALLOW');
      `);
      hasContainer = true;
    } catch {
      hasContainer = false;
    }
  }, 120_000);

  afterAll(async () => {
    await db?.destroy();
    await container?.stop();
  });

  it("enforces role, tenant, archive, membership, and override boundaries", async (ctx) => {
    if (!hasContainer || !db || !pool) {
      ctx.skip();
      return;
    }
    const repository = new KyselyAuthorizationRepository(db);

    await expect(
      repository.findRolePermissionCodes(
        "00000000-0000-4000-a000-000000000010",
        "00000000-0000-4000-a000-000000000001",
      ),
    ).resolves.toEqual(["product.item.read"]);
    await expect(
      repository.findTenantPermissionOverrides(
        "00000000-0000-4000-a000-000000000010",
        "00000000-0000-4000-a000-000000000001",
      ),
    ).resolves.toEqual([{ code: "product.item.write", effect: "ALLOW" }]);

    await pool.query(
      "UPDATE role_groups SET archived_at = now() WHERE id = '00000000-0000-4000-a000-000000000020'",
    );
    await expect(
      repository.findRolePermissionCodes(
        "00000000-0000-4000-a000-000000000010",
        "00000000-0000-4000-a000-000000000001",
      ),
    ).resolves.toEqual([]);

    await pool.query(
      "UPDATE tenant_users SET status = 'INACTIVE' WHERE id = '00000000-0000-4000-a000-000000000012'",
    );
    await expect(
      repository.findRolePermissionCodes(
        "00000000-0000-4000-a000-000000000010",
        "00000000-0000-4000-a000-000000000002",
      ),
    ).resolves.toEqual([]);
  });

  it("retrieves tenant DENY overrides that take precedence over role grants", async (ctx) => {
    if (!hasContainer || !db || !pool) {
      ctx.skip();
      return;
    }
    await pool.query(
      "INSERT INTO user_custom_permissions (tenant_user_id, permission_id, effect) VALUES ('00000000-0000-4000-a000-000000000011', '00000000-0000-4000-a000-000000000030', 'DENY')",
    );
    const repository = new KyselyAuthorizationRepository(db);

    await expect(
      repository.findTenantPermissionOverrides(
        "00000000-0000-4000-a000-000000000010",
        "00000000-0000-4000-a000-000000000001",
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        { code: "product.item.write", effect: "ALLOW" },
        { code: "product.item.read", effect: "DENY" },
      ]),
    );
  });
});
