import { describe, it, expect } from "vitest"
import { isAccountAgnosticPath } from "@/api/client"

// The API base URL may include a "/api" prefix (Vite dev proxy), so pathnames
// arrive as e.g. "/api/onboarding". Tests cover both prefixed and bare paths.

describe("isAccountAgnosticPath", () => {
  it("GET /me is account-agnostic", () => {
    expect(isAccountAgnosticPath("/me", "GET")).toBe(true)
    expect(isAccountAgnosticPath("/api/me", "GET")).toBe(true)
  })

  it("POST /onboarding is account-agnostic", () => {
    expect(isAccountAgnosticPath("/onboarding", "POST")).toBe(true)
    expect(isAccountAgnosticPath("/api/onboarding", "POST")).toBe(true)
  })

  it("POST /onboarding/light is account-agnostic", () => {
    expect(isAccountAgnosticPath("/onboarding/light", "POST")).toBe(true)
    expect(isAccountAgnosticPath("/api/onboarding/light", "POST")).toBe(true)
  })

  it("POST /onboarding/example-project is NOT account-agnostic (counterexample)", () => {
    // The $-anchored /onboarding rule must not leak onto the example-project
    // sub-path — it stays account-scoped and keeps X-Account-Id.
    expect(isAccountAgnosticPath("/onboarding/example-project", "POST")).toBe(false)
    expect(isAccountAgnosticPath("/api/onboarding/example-project", "POST")).toBe(false)
  })

  it("GET /onboarding does not match the POST-only rule", () => {
    expect(isAccountAgnosticPath("/onboarding", "GET")).toBe(false)
    expect(isAccountAgnosticPath("/onboarding/light", "GET")).toBe(false)
  })

  it("existing agnostic paths still return true", () => {
    // auth (any method)
    expect(isAccountAgnosticPath("/auth/login", "POST")).toBe(true)
    expect(isAccountAgnosticPath("/api/auth/refresh", "POST")).toBe(true)
    // GET /accounts
    expect(isAccountAgnosticPath("/accounts", "GET")).toBe(true)
    // palette (any method)
    expect(isAccountAgnosticPath("/palette", "GET")).toBe(true)
  })

  it("account-scoped paths return false", () => {
    expect(isAccountAgnosticPath("/projects", "GET")).toBe(false)
    // POST /accounts (create) is not the GET-only exclusion
    expect(isAccountAgnosticPath("/accounts", "POST")).toBe(false)
  })

  it("GET /account/me is NOT agnostic (must keep X-Account-Id)", () => {
    // The bare-"/me" agnostic rule must not leak onto the account-scoped
    // profile endpoint, which returns 400 missing_account_id without the header.
    expect(isAccountAgnosticPath("/account/me", "GET")).toBe(false)
    expect(isAccountAgnosticPath("/api/account/me", "GET")).toBe(false)
    // The bare aggregate identity endpoint stays agnostic.
    expect(isAccountAgnosticPath("/me", "GET")).toBe(true)
    expect(isAccountAgnosticPath("/api/me", "GET")).toBe(true)
  })
})
