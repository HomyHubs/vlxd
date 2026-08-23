import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { theme } from "../../../theme/index.js";
import { LoginPage } from "../pages/LoginPage.js";
import * as AuthContextModule from "../context/auth-context.js";

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe("<LoginPage />", () => {
  it("renders login page with platform branding, title, and language toggle", () => {
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

    renderWithTheme(<LoginPage />);

    expect(screen.getAllByText("VLXD Platform").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Đăng nhập hệ thống")).toBeInTheDocument();
    expect(
      screen.getByText("Quản lý chuỗi cung ứng & kinh doanh vật liệu xây dựng"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tiếng Việt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
  });

  it("switches interface language when clicking English toggle", () => {
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

    renderWithTheme(<LoginPage />);

    const enButton = screen.getByRole("button", { name: "English" });
    fireEvent.click(enButton);

    expect(screen.getByText("System Sign In")).toBeInTheDocument();
    expect(
      screen.getByText("Building materials supply chain & business management"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });
});
