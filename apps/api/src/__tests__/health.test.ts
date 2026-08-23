import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import type { Database } from "../platform/db/index.js";

describe("Health & Readiness Probes (TASK-009)", () => {
  const baseConfig = {
    NODE_ENV: "test" as const,
    PORT: 3001,
    HOST: "127.0.0.1",
    LOG_LEVEL: "fatal" as const,
    DATABASE_POOL_MIN: 0,
    DATABASE_POOL_MAX: 10,
    DATABASE_SSL: false,
    DATABASE_CONNECTION_TIMEOUT_MS: 10000,
    DATABASE_IDLE_TIMEOUT_MS: 30000,
  };

  it("GET /health returns 200 with status ok, version, and x-request-id", async () => {
    const app = buildApp(baseConfig);

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe("ok");
    expect(body.version).toBe("0.1.0");
    expect(typeof body.timestamp).toBe("string");
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
    expect(response.headers["x-request-id"]).toMatch(/^req-/);
  });

  it("GET /health/ready returns 200 with database disabled when no DB is provided", async () => {
    const app = buildApp(baseConfig);

    const response = await app.inject({
      method: "GET",
      url: "/health/ready",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe("ready");
    expect(body.database).toBe("disabled");
    expect(typeof body.timestamp).toBe("string");
  });

  it("GET /health/ready returns 200 with database connected when DB health check passes", async () => {
    const mockDb = new Kysely<Database>({
      dialect: {
        createAdapter: () => new PostgresAdapter(),
        createDriver: () => new DummyDriver(),
        createIntrospector: (db) => new PostgresIntrospector(db),
        createQueryCompiler: () => new PostgresQueryCompiler(),
      },
    });

    const app = buildApp({
      config: baseConfig,
      db: mockDb,
    });

    const response = await app.inject({
      method: "GET",
      url: "/health/ready",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe("ready");
    expect(body.database).toBe("connected");
  });

  it("GET /health/ready returns 503 with database disconnected when DB health check fails", async () => {
    const mockFailingDb = new Kysely<Database>({
      dialect: {
        createAdapter: () => new PostgresAdapter(),
        createDriver: () => ({
          init: async () => {},
          acquireConnection: async () => {
            throw new Error("Connection refused");
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

    const app = buildApp({
      config: baseConfig,
      db: mockFailingDb,
    });

    const response = await app.inject({
      method: "GET",
      url: "/health/ready",
    });

    expect(response.statusCode).toBe(503);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe("unready");
    expect(body.database).toBe("disconnected");
  });
});
