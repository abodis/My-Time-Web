import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import type { components } from "@/api/schema"

// Navigation spy: mock react-router-dom's useNavigate, keep the rest real.
const navigateSpy = vi.fn()
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return { ...actual, useNavigate: () => navigateSpy }
})

// API client: GET("/accounts") returns a single account so resolveAccount
// auto-selects and the entry gate runs against that resolved account id.
vi.mock("@/api/client", () => ({
  client: { GET: vi.fn() },
}))

// useMe: controlled MeResponse fixtures per test.
vi.mock("@/hooks/use-me", () => ({
  useMe: vi.fn(),
}))

import SelectAccountPage from "../select-account"
import { client } from "@/api/client"
import { useMe } from "@/hooks/use-me"
import { useAccountStore } from "@/stores/account-store"

type MeResponse = components["schemas"]["MeResponse"]

const ACCOUNT_ID = "11111111-1111-1111-1111-111111111111"

const ownerAccount = {
  id: ACCOUNT_ID,
  name: "Acme",
  role: "admin",
  isOwner: true,
}

const memberAccount = {
  id: ACCOUNT_ID,
  name: "Acme",
  role: "user",
  isOwner: false,
}

function meFixture(completed: boolean, isOwner: boolean): MeResponse {
  return {
    user: {
      id: "u1",
      email: "alex@demo.test",
      displayName: "Alex",
      timezone: null,
      avatar: null,
    },
    accounts: [{ id: ACCOUNT_ID, name: "Acme", role: "admin", isOwner }],
    onboarding: { completed, completedAt: null },
  }
}

function mockMe(data: MeResponse | undefined) {
  vi.mocked(useMe).mockReturnValue({ data } as ReturnType<typeof useMe>)
}

function mockAccounts(account: typeof ownerAccount) {
  vi.mocked(client.GET).mockResolvedValue({
    data: [account],
    error: undefined,
    response: new Response(),
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  useAccountStore.getState().clearAccountState()
  localStorage.clear()
})

afterEach(() => {
  useAccountStore.getState().clearAccountState()
})

describe("SelectAccountPage entry-gate wiring", () => {
  it("navigates to the tracker when onboarding is completed (Req 2.2)", async () => {
    mockAccounts(ownerAccount)
    mockMe(meFixture(true, true))

    render(<SelectAccountPage />)

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith("/", { replace: true })
    })
  })

  it("navigates to onboarding for an incomplete owner (Req 2.1, 2.6)", async () => {
    mockAccounts(ownerAccount)
    mockMe(meFixture(false, true))

    render(<SelectAccountPage />)

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith("/onboarding", { replace: true })
    })
  })

  it("navigates to onboarding for an incomplete non-owner (Req 2.1, 2.7)", async () => {
    mockAccounts(memberAccount)
    mockMe(meFixture(false, false))

    render(<SelectAccountPage />)

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith("/onboarding", { replace: true })
    })
  })

  it("stays on select-account (no navigation) when me is malformed (Req 2.3)", async () => {
    mockAccounts(ownerAccount)
    // Malformed: onboarding block absent → gate returns "stay".
    mockMe({
      user: {
        id: "u1",
        email: "alex@demo.test",
        displayName: "Alex",
        timezone: null,
        avatar: null,
      },
      accounts: [ownerAccount],
    } as unknown as MeResponse)

    render(<SelectAccountPage />)

    // Let the accounts fetch + effects settle so the account is resolved.
    await waitFor(() => {
      expect(useAccountStore.getState().activeAccountId).toBe(ACCOUNT_ID)
    })

    // The gate resolved to "stay": no routing to tracker or onboarding.
    expect(navigateSpy).not.toHaveBeenCalledWith("/", { replace: true })
    expect(navigateSpy).not.toHaveBeenCalledWith("/onboarding", {
      replace: true,
    })
  })
})
