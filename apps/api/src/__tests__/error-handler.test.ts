import { AppError, ErrorCode } from "@vlxd/shared";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { buildApp } from "../app.js";

describe("Global Error Handler & Error Envelope (TASK-009)", () => {
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

  it("handles 404 Not Found route and formats standard ErrorEnvelope", async () => {
    const app = buildApp(baseConfig);

    const response = await app.inject({
      method: "GET",
      url: "/unknown/route/path",
      headers: {
        "x-request-id": "req-custom-404-trace",
      },
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(body.error.message).toContain("Route GET /unknown/route/path not found");
    expect(body.error.requestId).toBe("req-custom-404-trace");
  });

  it("handles Zod validation errors on routes and formats ErrorCode.VALIDATION_ERROR", async () => {
    const app = buildApp(baseConfig);

    app.post(
      "/test/validate",
      {
        schema: {
          body: z.object({
            name: z.string().min(3),
            quantity: z.number().int().positive(),
          }),
        },
      },
      async (req) => {
        return { ok: true, data: req.body };
      },
    );

    const response = await app.inject({
      method: "POST",
      url: "/test/validate",
      headers: {
        "x-request-id": "req-val-trace",
      },
      payload: {
        name: "x",
        quantity: -5,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(body.error.requestId).toBe("req-val-trace");
    expect(body.error.details).toBeDefined();
    expect(body.error.details["body.name"]).toBeDefined();
    expect(body.error.details["body.quantity"]).toBeDefined();
  });

  it("handles custom domain AppError with status code and details", async () => {
    const app = buildApp(baseConfig);

    app.get("/test/domain-error", async () => {
      throw new AppError(
        "Product quota exceeded for current plan",
        ErrorCode.PLAN_LIMIT_REACHED,
        403,
        {
          limit: 80,
          currentCount: 80,
        },
      );
    });

    const response = await app.inject({
      method: "GET",
      url: "/test/domain-error",
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(ErrorCode.PLAN_LIMIT_REACHED);
    expect(body.error.message).toBe("Product quota exceeded for current plan");
    expect(body.error.details).toEqual({
      limit: 80,
      currentCount: 80,
    });
    expect(body.error.requestId).toMatch(/^req-/);
  });

  it("handles unhandled 500 server errors and NEVER leaks raw SQL or stack trace to client", async () => {
    const app = buildApp(baseConfig);

    app.get("/test/fatal-crash", async () => {
      const err = new Error(
        "FATAL_POSTGRES_LEAK: SELECT password_hash FROM users WHERE secret='raw_secret_value'",
      );
      throw err;
    });

    const response = await app.inject({
      method: "GET",
      url: "/test/fatal-crash",
      headers: {
        "x-request-id": "req-sanitized-500",
      },
    });

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    expect(body.error.message).toBe("An unexpected internal server error occurred");
    expect(body.error.requestId).toBe("req-sanitized-500");

    // Critical security check: Ensure NO stack trace or SQL secrets leaked in response
    expect(response.payload).not.toContain("FATAL_POSTGRES_LEAK");
    expect(response.payload).not.toContain("password_hash");
    expect(response.payload).not.toContain("raw_secret_value");
    expect(body.error.stack).toBeUndefined();
    expect(body.error.details).toBeUndefined();
  });
});
