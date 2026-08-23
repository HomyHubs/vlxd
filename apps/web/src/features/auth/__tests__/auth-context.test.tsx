import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../context/auth-context.js";
import { apiClient } from "../../../lib/api-client.js";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe("AuthContext & AuthProvider", () => {
  it("initializes with unauthenticated state when getAuthMe returns 401/null", async () => {
    vi.spyOn(apiClient, "getAuthMe").mockRejectedValue(new Error("Unauthorized"));

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.tenant).toBeNull();
  });

  it("authenticates and populates user info when login is called", async () => {
    vi.spyOn(apiClient, "getAuthMe").mockRejectedValue(new Error("Unauthorized"));
    vi.spyOn(apiClient, "login").mockResolvedValue({
      user: {
        id: "u-1",
        email: "admin@vlxd.vn",
        fullName: "Quản Trị Viên",
        status: "ACTIVE",
      },
      tenant: {
        id: "t-1",
        code: "VLXD-DEFAULT",
        name: "Công ty VLXD",
        status: "ACTIVE",
      },
      session: {
        id: "s-1",
        expiresAt: "2026-08-30T00:00:00Z",
        createdAt: "2026-08-23T00:00:00Z",
      },
      token: "raw-token-12345",
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mock subsequent getAuthMe
    vi.spyOn(apiClient, "getAuthMe").mockResolvedValue({
      user: {
        id: "u-1",
        email: "admin@vlxd.vn",
        fullName: "Quản Trị Viên",
        status: "ACTIVE",
      },
      tenant: {
        id: "t-1",
        code: "VLXD-DEFAULT",
        name: "Công ty VLXD",
        status: "ACTIVE",
      },
      session: {
        id: "s-1",
        expiresAt: "2026-08-30T00:00:00Z",
      },
      isOwner: true,
      titles: [],
    });

    await act(async () => {
      await result.current.login({
        email: "admin@vlxd.vn",
        password: "SecurePassword123",
      });
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe("admin@vlxd.vn");
      expect(result.current.tenant?.code).toBe("VLXD-DEFAULT");
    });
  });

  it("clears user and resets authenticated state on logout", async () => {
    vi.spyOn(apiClient, "getAuthMe").mockResolvedValue({
      user: {
        id: "u-1",
        email: "admin@vlxd.vn",
        fullName: "Quản Trị Viên",
        status: "ACTIVE",
      },
      tenant: {
        id: "t-1",
        code: "VLXD-DEFAULT",
        name: "Công ty VLXD",
        status: "ACTIVE",
      },
      session: {
        id: "s-1",
        expiresAt: "2026-08-30T00:00:00Z",
      },
      isOwner: true,
      titles: [],
    });

    vi.spyOn(apiClient, "logout").mockResolvedValue({
      success: true,
      message: "Logged out",
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // On logout, server session is destroyed, so future getAuthMe returns 401
    vi.spyOn(apiClient, "getAuthMe").mockRejectedValue(new Error("Unauthorized"));

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });
});
