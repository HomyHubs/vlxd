import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { describe, expect, it, vi } from "vitest";
import {
  checkDatabaseHealth,
  createDatabase,
  createTenantScope,
  type Database,
  withTransaction,
} from "../platform/db/index.js";

describe("Database Platform Utilities (TASK-009)", () => {
  it("throws error when createDatabase is called without DATABASE_URL", () => {
    expect(() =>
      createDatabase({
        NODE_ENV: "test",
        PORT: 3001,
        HOST: "127.0.0.1",
        LOG_LEVEL: "fatal",
        DATABASE_POOL_MIN: 0,
        DATABASE_POOL_MAX: 10,
        DATABASE_SSL: false,
        DATABASE_CONNECTION_TIMEOUT_MS: 10000,
        DATABASE_IDLE_TIMEOUT_MS: 30000,
      }),
    ).toThrow("DATABASE_URL is not configured");
  });

  it("creates Kysely instance when DATABASE_URL is provided", () => {
    const db = createDatabase({
      NODE_ENV: "test",
      PORT: 3001,
      HOST: "127.0.0.1",
      LOG_LEVEL: "fatal",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/vlxd_test",
      DATABASE_POOL_MIN: 1,
      DATABASE_POOL_MAX: 5,
      DATABASE_SSL: false,
      DATABASE_CONNECTION_TIMEOUT_MS: 5000,
      DATABASE_IDLE_TIMEOUT_MS: 10000,
    });

    expect(db).toBeDefined();
    expect(typeof db.destroy).toBe("function");
    expect(typeof db.transaction).toBe("function");
  });

  it("checkDatabaseHealth returns connected: true when query resolves", async () => {
    const mockDb = new Kysely<Database>({
      dialect: {
        createAdapter: () => new PostgresAdapter(),
        createDriver: () => new DummyDriver(),
        createIntrospector: (db) => new PostgresIntrospector(db),
        createQueryCompiler: () => new PostgresQueryCompiler(),
      },
    });

    const result = await checkDatabaseHealth(mockDb, 1000);
    expect(result.connected).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("checkDatabaseHealth returns connected: false when query throws error", async () => {
    const mockDb = new Kysely<Database>({
      dialect: {
        createAdapter: () => new PostgresAdapter(),
        createDriver: () => ({
          init: async () => {},
          acquireConnection: async () => {
            throw new Error("Postgres connection timeout");
          },
          beginTransaction: async () => {},
          commitTransaction: async () => {},
          rollbackTransaction: async () => {},
          releaseConnection: async () => {},
          destroy: async () => {},
        }),
        createIntrospector: (db) => new PostgresIntrospector(db),
        createQueryCompiler: () => new PostgresQueryCompiler(),
      },
    });

    const result = await checkDatabaseHealth(mockDb, 1000);
    expect(result.connected).toBe(false);
    expect(result.error).toContain("Postgres connection timeout");
  });

  it("withTransaction delegates to db.transaction().execute()", async () => {
    const mockCallback = vi.fn().mockResolvedValue("trx_result");
    const mockDb = {
      transaction: () => ({
        execute: async (fn: typeof mockCallback) => fn({} as never),
      }),
    } as unknown as Kysely<Database>;

    const result = await withTransaction(mockDb, mockCallback);
    expect(result).toBe("trx_result");
    expect(mockCallback).toHaveBeenCalled();
  });

  it("createTenantScope validates tenantId", () => {
    const scope = createTenantScope("00000000-0000-4000-a000-000000000001");
    expect(scope.tenantId).toBe("00000000-0000-4000-a000-000000000001");

    expect(() => createTenantScope("")).toThrow("Invalid tenant ID for tenant scope");
    expect(() => createTenantScope("   ")).toThrow("Invalid tenant ID for tenant scope");
  });
});
