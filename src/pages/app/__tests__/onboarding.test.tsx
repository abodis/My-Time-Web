import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import type { components } from "@/api/schema"
import { useAccountStore } from "@/stores/account-store"

type MeResponse = components["schemas"]["MeResponse"]

// Spy on navigation without a real router. Partial mock so the rest of
// react-router-dom (used by @/routes) still resolves.
const mockNavigate = vi.fn()
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Control the server-state hook.
vi.mock("@/hooks/use-me")
import { useMe } from "@/hooks/use-me"
const mockUseMe = vi.mocked(useMe)

// Stub the branch children so we assert WHICH branch rendered, not their internals.
vi.mock("@/components/onboarding/owner-wizard", () => ({
  OwnerWizard: () => <div>owner-wizard</div>,
}))
vi.mock("@/components/onboarding/non-owner-welcome", () => ({
  NonOwnerWelcome: () => <div>non-owner-welcome</div>,
}))

// Lazy import after mocks are registered.
import OnboardingPage from "../onboarding"

const ACCOUNT_ID = "acc-1"

function makeMe(overrides: {
  completed?: boolean | undefined
  isOwner?: boolean
  omitOnboarding?: boolean
}): MeResponse {
  const { completed, isOwner = true, omitOnboarding = false } = overrides
  const me = {
    user: {
      id: "user-1",
      email: "alex@demo.test",
      displayName: "Alex",
      timezone: "Europe/Madrid",
      avatar: null,
    },
    accounts: [{ id: ACCOUNT_ID, name: "Acme", role: "admin", isOwner }],
    onboarding: { completed: completed as boolean, completedAt: null },
  } as MeResponse

  if (omitOnboarding) {
    // Simulate a malformed/absent onboarding block.
    delete (me as { onboarding?: unknown }).onboarding
  }
  return me
}

function mockMe(data: MeResponse | undefined, isLoading = false) {
  mockUseMe.mockReturnValue({ data, isLoading } as ReturnType<typeof useMe>)
}

describe("OnboardingPage branching", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAccountStore.setState({ activeAccountId: ACCOUNT_ID, accounts: [] })
  })

  it("shows the spinner and does not navigate or render a branch while loading", () => {
    mockMe(undefined, true)

    render(<OnboardingPage />)

    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.queryByText("owner-wizard")).not.toBeInTheDocument()
    expect(screen.queryByText("non-owner-welcome")).not.toBeInTheDocument()
  })

  it("redirects completed users to the tracker", () => {
    mockMe(makeMe({ completed: true }))

    render(<OnboardingPage />)

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true })
    expect(screen.queryByText("owner-wizard")).not.toBeInTheDocument()
    expect(screen.queryByText("non-owner-welcome")).not.toBeInTheDocument()
  })

  it("renders the owner wizard for an incomplete owner", () => {
    mockMe(makeMe({ completed: false, isOwner: true }))

    render(<OnboardingPage />)

    expect(screen.getByText("owner-wizard")).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("renders the non-owner welcome for an incomplete non-owner", () => {
    mockMe(makeMe({ completed: false, isOwner: false }))

    render(<OnboardingPage />)

    expect(screen.getByText("non-owner-welcome")).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("redirects to account selection when the onboarding status is absent", () => {
    mockMe(makeMe({ omitOnboarding: true }))

    render(<OnboardingPage />)

    expect(mockNavigate).toHaveBeenCalledWith("/select-account", {
      replace: true,
    })
    expect(screen.queryByText("owner-wizard")).not.toBeInTheDocument()
    expect(screen.queryByText("non-owner-welcome")).not.toBeInTheDocument()
  })
})
