import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../../../../db/migrations");

describe("Database Migrations (TASK-008a - Identity & Tenancy)", () => {
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

  it("verifies 20260823000001_create_identity_and_tenancy.sql creates required tables and constraints", async () => {
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

    // Dependent child tables must be dropped before parent tables to avoid foreign key violations
    expect(sessionsIdx).toBeLessThan(usersIdx);
    expect(sessionsIdx).toBeLessThan(tenantsIdx);
    expect(tenantUsersIdx).toBeLessThan(usersIdx);
    expect(tenantUsersIdx).toBeLessThan(tenantsIdx);
  });
});
