import { describe, it, expect, vi } from "vitest";
import {
  createApiClient,
  ApiClientError,
  type ErrorEnvelope,
  type LoginRequest,
  type LoginResponse,
  type LogoutResponse,
  type AuthMeResponse,
} from "../index.js";

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

  it("calls /health/ready and returns typed ReadinessResponse", async () => {
    const mockReadiness = {
      status: "ready" as const,
      database: "connected" as const,
      timestamp: "2026-08-23T03:00:00.000Z",
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReadiness,
    });

    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await client.getReadiness();
    expect(result).toEqual(mockReadiness);
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/health/ready", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  });

  it("calls /api/v1/auth/login with credentials and returns LoginResponse", async () => {
    const mockLoginResponse: LoginResponse = {
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "admin@vlxd.vn",
        fullName: "Quản Trị Viên",
        status: "ACTIVE",
      },
      tenant: {
        id: "550e8400-e29b-41d4-a716-446655440001",
        code: "VLXD-DEFAULT",
        name: "Công ty VLXD Mẫu",
        status: "ACTIVE",
      },
      session: {
        id: "550e8400-e29b-41d4-a716-446655440002",
        expiresAt: "2026-08-30T00:00:00.000Z",
      },
      token: "mock-session-token-12345",
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockLoginResponse,
    });

    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const loginPayload: LoginRequest = {
      email: "admin@vlxd.vn",
      password: "password123",
      tenantCode: "VLXD-DEFAULT",
    };

    const result = await client.login(loginPayload);
    expect(result).toEqual(mockLoginResponse);
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/api/v1/auth/login", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginPayload),
    });
  });

  it("calls /api/v1/auth/logout with optional token and returns LogoutResponse", async () => {
    const mockLogoutResponse: LogoutResponse = {
      success: true,
      message: "Logout successful",
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockLogoutResponse,
    });

    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await client.logout("mock-token-abc");
    expect(result).toEqual(mockLogoutResponse);
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/api/v1/auth/logout", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer mock-token-abc",
      },
    });
  });

  it("calls /api/v1/auth/me with bearer token and returns AuthMeResponse", async () => {
    const mockMeResponse: AuthMeResponse = {
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "admin@vlxd.vn",
        fullName: "Quản Trị Viên",
        status: "ACTIVE",
      },
      tenant: {
        id: "550e8400-e29b-41d4-a716-446655440001",
        code: "VLXD-DEFAULT",
        name: "Công ty VLXD Mẫu",
        status: "ACTIVE",
      },
      session: {
        id: "550e8400-e29b-41d4-a716-446655440002",
        expiresAt: "2026-08-30T00:00:00.000Z",
      },
      isOwner: true,
      titles: [
        {
          id: "550e8400-e29b-41d4-a716-446655440003",
          code: "GDKD",
          name: "Giám đốc",
          roleGroup: {
            id: "550e8400-e29b-41d4-a716-446655440004",
            code: "SUPER_ADMIN",
            name: "Super admin",
          },
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMeResponse,
    });

    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await client.getAuthMe("mock-token-abc");
    expect(result).toEqual(mockMeResponse);
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/api/v1/auth/me", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer mock-token-abc",
      },
    });
  });

  it("calls POST /api/v1/tenant-users to invite tenant user", async () => {
    const mockResponse = {
      id: "550e8400-e29b-41d4-a716-446655440099",
      tenantId: "550e8400-e29b-41d4-a716-446655440001",
      userId: "550e8400-e29b-41d4-a716-446655440002",
      email: "staff@example.com",
      fullName: "Staff",
      status: "ACTIVE" as const,
      titleIds: ["550e8400-e29b-41d4-a716-446655440003"],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const payload = {
      email: "staff@example.com",
      titleIds: ["550e8400-e29b-41d4-a716-446655440003"],
    };

    const result = await client.inviteTenantUser(payload, "bearer-token");
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/api/v1/tenant-users", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer bearer-token",
      },
      body: JSON.stringify(payload),
    });
  });

  it("calls PATCH /api/v1/tenant-users/:id/status to update membership status", async () => {
    const mockResponse = {
      id: "550e8400-e29b-41d4-a716-446655440099",
      tenantId: "550e8400-e29b-41d4-a716-446655440001",
      userId: "550e8400-e29b-41d4-a716-446655440002",
      email: "staff@example.com",
      fullName: "Staff",
      status: "SUSPENDED" as const,
      titleIds: ["550e8400-e29b-41d4-a716-446655440003"],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await client.updateTenantUserStatus(
      "550e8400-e29b-41d4-a716-446655440099",
      { status: "SUSPENDED" },
      "bearer-token",
    );
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/tenant-users/550e8400-e29b-41d4-a716-446655440099/status",
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer bearer-token",
        },
        body: JSON.stringify({ status: "SUSPENDED" }),
      },
    );
  });

  it("calls PUT /api/v1/tenant-users/:id/titles to replace titles", async () => {
    const mockResponse = {
      id: "550e8400-e29b-41d4-a716-446655440099",
      tenantId: "550e8400-e29b-41d4-a716-446655440001",
      userId: "550e8400-e29b-41d4-a716-446655440002",
      email: "staff@example.com",
      fullName: "Staff",
      status: "ACTIVE" as const,
      titleIds: ["550e8400-e29b-41d4-a716-446655440010"],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const client = createApiClient({
      baseUrl: "http://localhost:3001",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await client.replaceTenantUserTitles(
      "550e8400-e29b-41d4-a716-446655440099",
      { titleIds: ["550e8400-e29b-41d4-a716-446655440010"] },
      "bearer-token",
    );
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/tenant-users/550e8400-e29b-41d4-a716-446655440099/titles",
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer bearer-token",
        },
        body: JSON.stringify({ titleIds: ["550e8400-e29b-41d4-a716-446655440010"] }),
      },
    );
  });
});
