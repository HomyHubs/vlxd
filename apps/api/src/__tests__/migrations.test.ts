import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../../../../db/migrations");
const seedsDir = path.resolve(__dirname, "../../../../db/seeds");

describe("Database Migrations (TASK-008 - Database Multi-tenant Foundation)", () => {
  it("contains valid migration files with YYYYMMDDHHMMSS timestamp naming", async () => {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql"));

    expect(sqlFiles.length).toBeGreaterThan(0);
    const timestampRegex = /^\d{14}_.+\.sql$/;

    for (const file of sqlFiles) {
      expect(file).toMatch(timestampRegex);
    }
  });

  it("ensures every migration file contains both -- migrate:up and -- migrate:down", async () => {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql"));

    for (const file of sqlFiles) {
      const content = await fs.readFile(path.join(migrationsDir, file), "utf-8");
      expect(content).toContain("-- migrate:up");
      expect(content).toContain("-- migrate:down");

      const [upSection, downSection] = content.split("-- migrate:down");
      expect(upSection?.trim().length).toBeGreaterThan(20);
      expect(downSection?.trim().length).toBeGreaterThan(20);
    }
  });

  it("verifies 20260823000001_create_identity_and_tenancy.sql (TASK-008a)", async () => {
    const migrationPath = path.join(
      migrationsDir,
      "20260823000001_create_identity_and_tenancy.sql",
    );
    const content = await fs.readFile(migrationPath, "utf-8");
    const [upContent, downContent] = content.split("-- migrate:down");

    // Table creation checks
    expect(upContent).toContain("CREATE TABLE IF NOT EXISTS tenants");
    expect(upContent).toContain("CREATE TABLE IF NOT EXISTS users");
    expect(upContent).toContain("CREATE TABLE IF NOT EXISTS tenant_users");
    expect(upContent).toContain("CREATE TABLE IF NOT EXISTS sessions");

    // UTC Timestamps check
    expect(upContent).toContain("TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())");
    expect(upContent).toContain("archived_at TIMESTAMPTZ DEFAULT NULL");

    // Foreign Key & Cascading Deletion
    expect(upContent).toContain("REFERENCES tenants(id) ON DELETE CASCADE");
    expect(upContent).toContain("REFERENCES users(id) ON DELETE CASCADE");

    // Unique Constraints
    expect(upContent).toContain(
      "CONSTRAINT uq_tenant_users_tenant_user UNIQUE (tenant_id, user_id)",
    );
    expect(upContent).toContain("code VARCHAR(50) NOT NULL UNIQUE");
    expect(upContent).toContain("email VARCHAR(255) NOT NULL UNIQUE");
    expect(upContent).toContain("token_hash VARCHAR(255) NOT NULL UNIQUE");

    // Indexes
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_tenants_status");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_sessions_tenant_user");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_sessions_expires_at");

    // Clean Reversibility Check in Down section (Reverse dependency drop order)
    expect(downContent).toContain("DROP TABLE IF EXISTS sessions;");
    expect(downContent).toContain("DROP TABLE IF EXISTS tenant_users;");
    expect(downContent).toContain("DROP TABLE IF EXISTS users;");
    expect(downContent).toContain("DROP TABLE IF EXISTS tenants;");

    const sessionsIdx = downContent?.indexOf("DROP TABLE IF EXISTS sessions;") ?? -1;
    const tenantUsersIdx = downContent?.indexOf("DROP TABLE IF EXISTS tenant_users;") ?? -1;
    const usersIdx = downContent?.indexOf("DROP TABLE IF EXISTS users;") ?? -1;
    const tenantsIdx = downContent?.indexOf("DROP TABLE IF EXISTS tenants;") ?? -1;

    expect(sessionsIdx).toBeLessThan(usersIdx);
    expect(sessionsIdx).toBeLessThan(tenantsIdx);
    expect(tenantUsersIdx).toBeLessThan(usersIdx);
    expect(tenantUsersIdx).toBeLessThan(tenantsIdx);
  });

  it("verifies 20260823000002_create_permissions_and_roles.sql (TASK-008b)", async () => {
    const migrationPath = path.join(
      migrationsDir,
      "20260823000002_create_permissions_and_roles.sql",
    );
    const content = await fs.readFile(migrationPath, "utf-8");
    const [upContent, downContent] = content.split("-- migrate:down");

    // Table creation checks
    expect(upContent).toContain("CREATE TABLE IF NOT EXISTS role_groups");
    expect(upContent).toContain("CREATE TABLE IF NOT EXISTS permissions");
    expect(upContent).toContain("CREATE TABLE IF NOT EXISTS role_group_permissions");
    expect(upContent).toContain("CREATE TABLE IF NOT EXISTS titles");
    expect(upContent).toContain("CREATE TABLE IF NOT EXISTS tenant_user_titles");
    expect(upContent).toContain("CREATE TABLE IF NOT EXISTS user_custom_permissions");

    // UTC Timestamps check
    expect(upContent).toContain("TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())");
    expect(upContent).toContain("archived_at TIMESTAMPTZ DEFAULT NULL");

    // Foreign Keys
    expect(upContent).toContain("REFERENCES role_groups(id) ON DELETE CASCADE");
    expect(upContent).toContain("REFERENCES permissions(id) ON DELETE CASCADE");
    expect(upContent).toContain("REFERENCES tenants(id) ON DELETE CASCADE");
    expect(upContent).toContain("REFERENCES role_groups(id) ON DELETE RESTRICT");
    expect(upContent).toContain("REFERENCES tenant_users(id) ON DELETE CASCADE");
    expect(upContent).toContain("REFERENCES titles(id) ON DELETE CASCADE");

    // Unique Constraints
    expect(upContent).toContain(
      "CONSTRAINT uq_role_group_permissions UNIQUE (role_group_id, permission_id)",
    );
    expect(upContent).toContain("CONSTRAINT uq_titles_tenant_code UNIQUE (tenant_id, code)");
    expect(upContent).toContain(
      "CONSTRAINT uq_tenant_user_titles UNIQUE (tenant_user_id, title_id)",
    );
    expect(upContent).toContain(
      "CONSTRAINT uq_user_custom_permissions UNIQUE (tenant_user_id, permission_id, scope_type, scope_value)",
    );

    // Indexes
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_role_groups_archived_at");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_permissions_module");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_role_group_permissions_role_group");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_titles_tenant_id");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_tenant_user_titles_tenant_user_id");
    expect(upContent).toContain(
      "CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_tenant_user",
    );

    // Clean Reversibility Check in Down section (Reverse dependency drop order)
    expect(downContent).toContain("DROP TABLE IF EXISTS user_custom_permissions;");
    expect(downContent).toContain("DROP TABLE IF EXISTS tenant_user_titles;");
    expect(downContent).toContain("DROP TABLE IF EXISTS titles;");
    expect(downContent).toContain("DROP TABLE IF EXISTS role_group_permissions;");
    expect(downContent).toContain("DROP TABLE IF EXISTS permissions;");
    expect(downContent).toContain("DROP TABLE IF EXISTS role_groups;");

    const customPermsIdx =
      downContent?.indexOf("DROP TABLE IF EXISTS user_custom_permissions;") ?? -1;
    const tenantUserTitlesIdx =
      downContent?.indexOf("DROP TABLE IF EXISTS tenant_user_titles;") ?? -1;
    const titlesIdx = downContent?.indexOf("DROP TABLE IF EXISTS titles;") ?? -1;
    const roleGroupPermsIdx =
      downContent?.indexOf("DROP TABLE IF EXISTS role_group_permissions;") ?? -1;
    const permsIdx = downContent?.indexOf("DROP TABLE IF EXISTS permissions;") ?? -1;
    const roleGroupsIdx = downContent?.indexOf("DROP TABLE IF EXISTS role_groups;") ?? -1;

    expect(customPermsIdx).toBeLessThan(permsIdx);
    expect(tenantUserTitlesIdx).toBeLessThan(titlesIdx);
    expect(titlesIdx).toBeLessThan(roleGroupsIdx);
    expect(roleGroupPermsIdx).toBeLessThan(permsIdx);
    expect(roleGroupPermsIdx).toBeLessThan(roleGroupsIdx);
  });

  it("verifies 20260823000003_create_audit_logs_and_plans.sql (TASK-008c)", async () => {
    const migrationPath = path.join(
      migrationsDir,
      "20260823000003_create_audit_logs_and_plans.sql",
    );
    const content = await fs.readFile(migrationPath, "utf-8");
    const [upContent, downContent] = content.split("-- migrate:down");

    // Table creation checks
    expect(upContent).toContain("CREATE TABLE IF NOT EXISTS tenant_plans");
    expect(upContent).toContain("CREATE TABLE IF NOT EXISTS audit_logs");

    // UTC Timestamps check
    expect(upContent).toContain("TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())");
    expect(upContent).toContain(
      "started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())",
    );
    expect(upContent).toContain("archived_at TIMESTAMPTZ DEFAULT NULL");

    // Foreign Keys
    expect(upContent).toContain("REFERENCES tenants(id) ON DELETE CASCADE");
    expect(upContent).toContain("REFERENCES users(id) ON DELETE SET NULL");

    // JSONB columns
    expect(upContent).toContain("features JSONB NOT NULL DEFAULT '{}'::jsonb");
    expect(upContent).toContain("before_state JSONB DEFAULT NULL");
    expect(upContent).toContain("after_state JSONB DEFAULT NULL");

    // Check constraints
    expect(upContent).toContain(
      "CHECK (plan_code IN ('FREE', 'STANDARD', 'PREMIUM', 'ENTERPRISE'))",
    );
    expect(upContent).toContain(
      "CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'))",
    );

    // Indexes
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_tenant_plans_tenant_id");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_tenant_plans_status");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_tenant_plans_plan_code");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_audit_logs_action");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_audit_logs_entity");
    expect(upContent).toContain("CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at");

    // Clean Reversibility Check in Down section
    expect(downContent).toContain("DROP TABLE IF EXISTS audit_logs;");
    expect(downContent).toContain("DROP TABLE IF EXISTS tenant_plans;");

    const auditLogsIdx = downContent?.indexOf("DROP TABLE IF EXISTS audit_logs;") ?? -1;
    const tenantPlansIdx = downContent?.indexOf("DROP TABLE IF EXISTS tenant_plans;") ?? -1;

    expect(auditLogsIdx).toBeLessThan(tenantPlansIdx);
  });

  it("verifies deterministic_seeds.sql uses only fake mock data and no production secrets", async () => {
    const seedPath = path.join(seedsDir, "deterministic_seeds.sql");
    const content = await fs.readFile(seedPath, "utf-8");

    expect(content).toContain("INSERT INTO role_groups");
    expect(content).toContain("SUPER_ADMIN");
    expect(content).toContain("SYSTEM_ADMIN");
    expect(content).toContain("SUPPORT_ADMIN");
    expect(content).toContain("USER");

    expect(content).toContain("INSERT INTO permissions");
    expect(content).toContain("product.item.read");
    expect(content).toContain("inventory.stock.read");
    expect(content).toContain("sales.order.create");
    expect(content).toContain("finance.payment.create");
    expect(content).toContain("audit.log.read");

    expect(content).toContain("INSERT INTO titles");
    expect(content).toContain("INSERT INTO tenants");
    expect(content).toContain("INSERT INTO users");
    expect(content).toContain("INSERT INTO tenant_users");
    expect(content).toContain("INSERT INTO tenant_plans");

    // Must not contain real password/secret strings
    expect(content).not.toContain("supersecret");
    expect(content).not.toContain("AKIA");
    expect(content).not.toContain("ghp_");
  });
});
