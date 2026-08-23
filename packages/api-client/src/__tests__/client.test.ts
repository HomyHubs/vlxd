import { describe, it, expect, vi } from "vitest";
import { createApiClient, ApiClientError, type ErrorEnvelope } from "../index.js";

describe("@vlxd/api-client", () => {
  it("normalizes baseUrl with trailing slashes", () => {
    const client = createApiClient({ baseUrl: "http://localhost:3001///" });
    expect(client.baseUrl).toBe("http://localhost:3001");
  });

  it("calls /health and returns typed HealthResponse", async () => {
    const mockHealth = {
      status: "ok" as const,
      version: "0.1.0",
      timestamp: "2026-08-23T03:00:00.000Z",
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHealth,
    });

    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchFn: mockFetch as unknown as typeof fetch,
      defaultHeaders: { "X-Client": "vlxd-web" },
    });

    const result = await client.getHealth();
    expect(result).toEqual(mockHealth);
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/health", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Client": "vlxd-web",
      },
    });
  });

  it("throws ApiClientError with parsed ErrorEnvelope when API returns error response", async () => {
    const mockEnvelope: ErrorEnvelope = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input parameters",
        requestId: "req-12345",
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => mockEnvelope,
    });

    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    try {
      await client.getHealth();
      expect.fail("Expected getHealth() to throw ApiClientError");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      const apiError = err as ApiClientError;
      expect(apiError.status).toBe(400);
      expect(apiError.message).toBe("Invalid input parameters");
      expect(apiError.code).toBe("VALIDATION_ERROR");
      expect(apiError.requestId).toBe("req-12345");
      expect(apiError.envelope).toEqual(mockEnvelope);
    }
  });

  it("throws ApiClientError with fallback message when error response is not JSON", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    try {
      await client.getHealth();
      expect.fail("Expected getHealth() to throw ApiClientError");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      const apiError = err as ApiClientError;
      expect(apiError.status).toBe(502);
      expect(apiError.message).toBe("API request failed with HTTP 502");
      expect(apiError.envelope).toBeUndefined();
    }
  });
});
