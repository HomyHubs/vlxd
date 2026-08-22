import { test, expect } from "@playwright/test";

test.describe("Frontend Shell Smoke", () => {
  test("loads landing shell with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/VLXD — Quản lý Vật liệu Xây dựng/);
    await expect(page.getByText("VLXD Platform")).toBeVisible();
  });
});
