import { test, expect } from "playwright/test"

test("login page loads and shows login form", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible()
})

test("authenticated user sees app shell", async ({ page }) => {
  // Simulate stored session by injecting refresh token
  await page.goto("/")
  await page.evaluate(() => {
    localStorage.setItem("mtb_refresh_token", "fake-token")
  })
  await page.goto("/")

  // App shell should render with pill nav
  await expect(page.locator("[data-testid='app-shell']")).toBeVisible()
})
