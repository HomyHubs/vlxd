import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { theme } from "../theme/index.js";
import { App } from "../App.js";
import * as AuthContextModule from "../features/auth/context/auth-context.js";

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe("<App />", () => {
  it("renders LoginPage when user is not authenticated", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      tenant: null,
      session: null,
      isOwner: false,
      titles: [],
      isAuthenticated: false,
      isLoading: false,
      isError: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchAuth: vi.fn(),
    });

    renderWithTheme(<App />);

    expect(screen.getByText("Đăng nhập hệ thống")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeInTheDocument();
  });

  it("renders authenticated dashboard and UserProfileCard when user is authenticated", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "u-1",
        email: "admin@vlxd.vn",
        fullName: "Quản Trị Viên",
        status: "ACTIVE",
      },
      tenant: {
        id: "t-1",
        code: "VLXD-DEFAULT",
        name: "Công ty VLXD Mẫu",
        status: "ACTIVE",
      },
      session: {
        id: "s-1",
        expiresAt: "2026-08-30T00:00:00Z",
      },
      isOwner: true,
      titles: [],
      isAuthenticated: true,
      isLoading: false,
      isError: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchAuth: vi.fn(),
    });

    renderWithTheme(<App />);

    expect(screen.getByText("VLXD Platform")).toBeInTheDocument();
    expect(screen.getByText("Hệ thống Quản lý Vật liệu Xây dựng")).toBeInTheDocument();
    expect(screen.getByText("Quản Trị Viên")).toBeInTheDocument();
    expect(screen.getByText(/Công ty VLXD Mẫu/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
  });

  it("switches language in authenticated view when English button is clicked", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "u-1",
        email: "admin@vlxd.vn",
        fullName: "Admin",
        status: "ACTIVE",
      },
      tenant: {
        id: "t-1",
        code: "VLXD-DEFAULT",
        name: "VLXD Co",
        status: "ACTIVE",
      },
      session: null,
      isOwner: false,
      titles: [],
      isAuthenticated: true,
      isLoading: false,
      isError: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchAuth: vi.fn(),
    });

    renderWithTheme(<App />);

    const enButton = screen.getByRole("button", { name: "English" });
    fireEvent.click(enButton);

    expect(screen.getByText("Construction Materials Management System")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
  });
});
