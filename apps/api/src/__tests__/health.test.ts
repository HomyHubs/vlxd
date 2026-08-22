import { describe, it, expect } from "vitest";
import { buildApp } from "../app.js";

describe("GET /health", () => {
  it("returns 200 with status ok, version, and valid timestamp", async () => {
    const app = buildApp({
      NODE_ENV: "test",
      PORT: 3001,
      HOST: "127.0.0.1",
      LOG_LEVEL: "fatal",
    });

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
  });
});
