import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { theme } from "../../../theme/index.js";
import { UserProfileCard } from "../components/UserProfileCard.js";
import * as AuthContextModule from "../context/auth-context.js";

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe("<UserProfileCard />", () => {
  it("renders null when user or tenant is not present", () => {
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

    const { container } = renderWithTheme(<UserProfileCard />);
    expect(container.firstChild).toBeNull();
  });

  it("renders user information, tenant details, and owner badge", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "u-1",
        email: "giamdoc@vlxd.vn",
        fullName: "Nguyễn Văn Giám Đốc",
        status: "ACTIVE",
      },
      tenant: {
        id: "t-1",
        code: "VLXD-HANOI",
        name: "VLXD Hà Nội",
        status: "ACTIVE",
      },
      session: {
        id: "s-1",
        expiresAt: "2026-08-30T00:00:00Z",
      },
      isOwner: true,
      titles: [
        {
          id: "title-1",
          code: "DIRECTOR",
          name: "Giám Đốc Doanh Nghiệp",
          roleGroup: {
            id: "rg-1",
            code: "SUPER_ADMIN",
            name: "Super Admin",
          },
        },
      ],
      isAuthenticated: true,
      isLoading: false,
      isError: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchAuth: vi.fn(),
    });

    renderWithTheme(<UserProfileCard />);

    expect(screen.getByText("Nguyễn Văn Giám Đốc")).toBeInTheDocument();
    expect(screen.getByText("giamdoc@vlxd.vn")).toBeInTheDocument();
    expect(screen.getByText(/VLXD Hà Nội \(VLXD-HANOI\)/i)).toBeInTheDocument();
    expect(screen.getByText("Chủ doanh nghiệp")).toBeInTheDocument();
    expect(screen.getByText("Giám Đốc Doanh Nghiệp")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
  });

  it("calls logout when logout button is clicked", async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "u-1",
        email: "staff@vlxd.vn",
        fullName: "Nhân Viên",
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
      logout: mockLogout,
      refetchAuth: vi.fn(),
    });

    renderWithTheme(<UserProfileCard />);

    const logoutButton = screen.getByRole("button", { name: "Đăng xuất" });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
