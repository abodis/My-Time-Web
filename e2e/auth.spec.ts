import { test, expect } from "playwright/test"

test("login page loads and shows login form", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible()
})

test("unauthenticated user is redirected to login", async ({ page }) => {
  // Navigate to a protected route without valid auth
  await page.goto("/")

  // Should redirect to login page
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible()
})
