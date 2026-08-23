import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

describe("Request ID Middleware & Propagation (TASK-009)", () => {
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

  it("propagates client-provided x-request-id header", async () => {
    const app = buildApp(baseConfig);
    const clientTraceId = "req-client-trace-12345";

    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: {
        "x-request-id": clientTraceId,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toBe(clientTraceId);
  });

  it("generates a new unique req- prefixed UUID when x-request-id is omitted", async () => {
    const app = buildApp(baseConfig);

    const response1 = await app.inject({
      method: "GET",
      url: "/health",
    });

    const response2 = await app.inject({
      method: "GET",
      url: "/health",
    });

    const id1 = response1.headers["x-request-id"] as string;
    const id2 = response2.headers["x-request-id"] as string;

    expect(id1).toMatch(/^req-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(id2).toMatch(/^req-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(id1).not.toBe(id2);
  });
});
