import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { theme } from "../theme/index.js";
import { App } from "../App.js";

describe("<App />", () => {
  it("renders header and main title in Vietnamese by default", () => {
    render(
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>,
    );

    expect(screen.getByText("VLXD Platform")).toBeInTheDocument();
    expect(screen.getByText("Hệ thống Quản lý Vật liệu Xây dựng")).toBeInTheDocument();
  });

  it("switches language to English when English button is clicked", () => {
    render(
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>,
    );

    const enButton = screen.getByRole("button", { name: "English" });
    fireEvent.click(enButton);

    expect(screen.getByText("Construction Materials Management System")).toBeInTheDocument();
  });
});
