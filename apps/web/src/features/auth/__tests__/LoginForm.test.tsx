import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { theme } from "../../../theme/index.js";
import { LoginForm } from "../components/LoginForm.js";
import * as AuthContextModule from "../context/auth-context.js";

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe("<LoginForm />", () => {
  it("renders email, password, tenantCode inputs and submit button", () => {
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

    renderWithTheme(<LoginForm />);

    expect(screen.getByLabelText(/Địa chỉ email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mã công ty/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeInTheDocument();
  });

  it("shows validation error on invalid email and short password without calling login", async () => {
    const mockLogin = vi.fn();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      tenant: null,
      session: null,
      isOwner: false,
      titles: [],
      isAuthenticated: false,
      isLoading: false,
      isError: false,
      login: mockLogin,
      logout: vi.fn(),
      refetchAuth: vi.fn(),
    });

    renderWithTheme(<LoginForm />);

    const emailInput = screen.getByLabelText(/Địa chỉ email/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitButton = screen.getByRole("button", { name: "Đăng nhập" });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email không đúng định dạng")).toBeInTheDocument();
      expect(screen.getByText("Mật khẩu tối thiểu 6 ký tự")).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("calls login with entered credentials and triggers onSuccess on valid submission", async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      user: { id: "1", email: "admin@vlxd.vn", fullName: "Admin", status: "ACTIVE" },
      tenant: { id: "2", code: "VLXD", name: "VLXD Co", status: "ACTIVE" },
      session: { id: "3", expiresAt: "2026-08-30T00:00:00Z" },
      token: "tok",
    });
    const mockOnSuccess = vi.fn();

    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      tenant: null,
      session: null,
      isOwner: false,
      titles: [],
      isAuthenticated: false,
      isLoading: false,
      isError: false,
      login: mockLogin,
      logout: vi.fn(),
      refetchAuth: vi.fn(),
    });

    renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/Địa chỉ email/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const tenantInput = screen.getByLabelText(/Mã công ty/i);
    const submitButton = screen.getByRole("button", { name: "Đăng nhập" });

    fireEvent.change(emailInput, { target: { value: "admin@vlxd.vn" } });
    fireEvent.change(passwordInput, { target: { value: "ValidPassword123" } });
    fireEvent.change(tenantInput, { target: { value: "VLXD-BRANCH-1" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "admin@vlxd.vn",
        password: "ValidPassword123",
        tenantCode: "VLXD-BRANCH-1",
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("displays localized error message when login fails with INVALID_CREDENTIALS", async () => {
    const mockLogin = vi.fn().mockRejectedValue({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    });

    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      tenant: null,
      session: null,
      isOwner: false,
      titles: [],
      isAuthenticated: false,
      isLoading: false,
      isError: false,
      login: mockLogin,
      logout: vi.fn(),
      refetchAuth: vi.fn(),
    });

    renderWithTheme(<LoginForm />);

    const emailInput = screen.getByLabelText(/Địa chỉ email/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitButton = screen.getByRole("button", { name: "Đăng nhập" });

    fireEvent.change(emailInput, { target: { value: "admin@vlxd.vn" } });
    fireEvent.change(passwordInput, { target: { value: "WrongPassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email hoặc mật khẩu không chính xác.")).toBeInTheDocument();
    });
  });

  it("displays localized error message when user is USER_SUSPENDED", async () => {
    const mockLogin = vi.fn().mockRejectedValue({
      code: "USER_SUSPENDED",
      message: "User account is suspended",
    });

    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      tenant: null,
      session: null,
      isOwner: false,
      titles: [],
      isAuthenticated: false,
      isLoading: false,
      isError: false,
      login: mockLogin,
      logout: vi.fn(),
      refetchAuth: vi.fn(),
    });

    renderWithTheme(<LoginForm />);

    const emailInput = screen.getByLabelText(/Địa chỉ email/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const submitButton = screen.getByRole("button", { name: "Đăng nhập" });

    fireEvent.change(emailInput, { target: { value: "blocked@vlxd.vn" } });
    fireEvent.change(passwordInput, { target: { value: "Password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động."),
      ).toBeInTheDocument();
    });
  });
});
