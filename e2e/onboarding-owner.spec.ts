import { test, expect } from "playwright/test"

// Owner happy-path smoke for the onboarding-experience feature.
// Exercises the full first-run owner flow end-to-end against the local dev API:
//   register (fresh owner) → confirm (any code) → login → account resolution
//   → entry gate routes the incomplete owner to /onboarding
//   → OwnerWizard: Profile (POST /onboarding) → WorkspacePath (Fast)
//   → FastPathSeeder (POST /onboarding/example-project) → Invite (Skip)
//   → Summary (Finish) → tracker "/" with the TrackerPointer hint shown.
//
// Registering a FRESH user each run keeps the owner path deterministic: a reused
// user may already have onboarding.completed=true, which the gate would route
// straight to the tracker (skipping the wizard). Local register auto-confirms
// and POST /auth/confirm accepts any code (confirmed by the API owner).
// Covers requirements 2.x, 3.x, 4.x, 5.x, 7.x, 8.x.

test("owner completes onboarding wizard and lands on tracker with pointer", async ({
  page,
}) => {
  const email = `owner+${Date.now()}@demo.test`
  const password = "password123"

  // NOTE: the auth forms use the shadcn <Form> primitive, whose FormLabel's
  // htmlFor points at the FormControl wrapper div (not the <input>), so
  // getByLabel does not resolve there. Target auth inputs by placeholder.
  // The onboarding steps use a plain Label htmlFor→Input id, so getByLabel
  // works for those.

  // 1. Register a fresh owner.
  await page.goto("/register")
  await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible()
  await page.getByPlaceholder("you@example.com").fill(email)
  await page.getByPlaceholder(/min 8 characters/i).fill(password)
  await page.getByRole("button", { name: /register/i }).click()

  // Register success navigates to the confirm page.
  await expect(page).toHaveURL(/\/confirm/)

  // 2. Confirm with any code (local dev accepts any value).
  await page.getByPlaceholder("you@example.com").fill(email)
  await page.getByPlaceholder(/enter code/i).fill("123456")
  await page.getByRole("button", { name: /^confirm$/i }).click()

  // Confirm success navigates to login.
  await expect(page).toHaveURL(/\/login/)

  // 3. Log in. Login navigates to /select-account, which resolves the account
  //    and the entry gate routes the incomplete owner to /onboarding.
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible()
  await page.getByPlaceholder("you@example.com").fill(email)
  await page.getByPlaceholder("••••••••").fill(password)
  await page.getByRole("button", { name: /sign in/i }).click()

  // 2.x — after account resolution the app lands on the onboarding wizard.
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 })

  // OwnerWizard Profile step renders (3.x).
  await expect(page.getByLabel("Your name")).toBeVisible()
  await expect(page.getByLabel("Timezone")).toBeVisible()
  await expect(page.getByLabel("Account currency")).toBeVisible()
  await page.screenshot({
    path: "test-screenshots/onboarding-owner-wizard.png",
    fullPage: true,
  })

  // 3. Fill Profile and submit → POST /onboarding, advance to WorkspacePath.
  const nameField = page.getByLabel("Your name")
  await nameField.fill("") // clear any pre-filled displayName
  await nameField.fill("Owner Smoke")
  // Timezone is pre-filled from Intl; leave it, just ensure non-empty.
  await expect(page.getByLabel("Timezone")).not.toHaveValue("")
  await page.getByLabel("Account currency").selectOption("EUR")
  await page.getByRole("button", { name: /continue/i }).click()

  // 4.x — WorkspacePath step renders with the two path cards.
  await expect(
    page.getByRole("heading", { name: /set up your workspace/i }),
  ).toBeVisible()
  const fastPath = page.getByRole("radio", { name: /fast path/i })
  await expect(fastPath).toBeVisible()

  // 4. Choose the FAST path, then advance.
  await fastPath.click()
  await expect(fastPath).toHaveAttribute("aria-checked", "true")
  await page.getByRole("button", { name: /continue/i }).click()

  // 5.x — FastPathSeeder runs (POST /onboarding/example-project) and, on
  //        201/409, advances to the Invite step.
  await expect(
    page.getByRole("heading", { name: /set up your team/i }),
  ).toBeVisible({ timeout: 30_000 })

  // 7.x — On Invite, click Skip → advance to Summary sending nothing.
  await page.getByRole("button", { name: /^skip$/i }).click()

  // 8.x — Summary step renders the recap.
  await expect(page.getByRole("heading", { name: /you're all set/i })).toBeVisible()

  // 6. Finish → navigate to the tracker.
  await page.getByRole("button", { name: /go to tracker/i }).click()

  // Lands on the tracker "/" (not /onboarding, /login, or /select-account).
  await expect(page).toHaveURL(/\/$/)

  // 8.4/8.6 — the TrackerPointer first-run hint is shown on hand-off.
  await expect(
    page.getByText(/start your first timer/i),
  ).toBeVisible({ timeout: 15_000 })

  await page.screenshot({
    path: "test-screenshots/onboarding-owner-tracker.png",
    fullPage: true,
  })
})
