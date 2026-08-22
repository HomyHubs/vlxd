import { describe, it, expect, vi } from "vitest";
import { createApiClient } from "../index.js";

describe("@vlxd/api-client", () => {
  it("calls /health and parses JSON response", async () => {
    const mockHealth = {
      status: "ok" as const,
      version: "0.1.0",
      timestamp: "2026-08-22T00:00:00.000Z",
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHealth,
    });

    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await client.getHealth();
    expect(result).toEqual(mockHealth);
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/health", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  });

  it("throws error when response is not ok", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    await expect(client.getHealth()).rejects.toThrow("HTTP 500");
  });
});
