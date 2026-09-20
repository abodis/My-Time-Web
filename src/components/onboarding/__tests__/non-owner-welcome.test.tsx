import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import type { components } from "@/api/schema"

type MeResponse = components["schemas"]["MeResponse"]

// Spy on navigation without a real router. Partial mock so the rest of
// react-router-dom (used by @/routes, which calls createBrowserRouter) resolves.
const mockNavigate = vi.fn()
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Control the identity hook (pre-fills displayName).
vi.mock("@/hooks/use-me")
import { useMe } from "@/hooks/use-me"
const mockUseMe = vi.mocked(useMe)

// Control the completion mutation (resolve/reject on demand).
const mockMutateAsync = vi.fn()
vi.mock("@/hooks/use-onboarding", () => ({
  useCompleteLightOnboarding: () => ({ mutateAsync: mockMutateAsync }),
}))

// Lazy import after mocks are registered.
import { NonOwnerWelcome } from "../non-owner-welcome"

function makeMe(displayName: string | null): MeResponse {
  return {
    user: {
      id: "user-1",
      email: "sam@demo.test",
      displayName,
      timezone: "Europe/Madrid",
      avatar: null,
    },
    accounts: [{ id: "acc-1", name: "Acme", role: "user", isOwner: false }],
    onboarding: { completed: false, completedAt: null },
  } as MeResponse
}

function mockMe(displayName: string | null) {
  mockUseMe.mockReturnValue({
    data: makeMe(displayName),
  } as ReturnType<typeof useMe>)
}

describe("NonOwnerWelcome", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("blocks submit with a field error and does not call the mutation when the name is empty", async () => {
    mockMe("Sam") // pre-fills displayName so we can clear it

    render(<NonOwnerWelcome />)

    // Clear the pre-filled name to trigger client-side validation.
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Start tracking" }))

    // Field error surfaced, mutation and navigation never fire.
    expect(await screen.findByText("Enter your name")).toBeInTheDocument()
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("surfaces a failed POST /onboarding/light inline, retains values, and does not navigate", async () => {
    mockMe("Sam")

    // Deployed API 400 envelope: { type, message, fields? }.
    mockMutateAsync.mockRejectedValueOnce({
      type: "invalid_format",
      message: "That timezone is not recognized.",
    })

    render(<NonOwnerWelcome />)

    fireEvent.click(screen.getByRole("button", { name: "Start tracking" }))

    // Mutation attempted with the form values.
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))
    expect(mockMutateAsync).toHaveBeenCalledWith({
      displayName: "Sam",
      timezone: "Europe/Madrid",
      avatar: null,
    })

    // Server message shown inline; no navigation to the tracker.
    expect(
      await screen.findByText("That timezone is not recognized.")
    ).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()

    // Values retained after failure.
    expect(screen.getByLabelText("Your name")).toHaveValue("Sam")
    expect(screen.getByLabelText("Timezone")).toHaveValue("Europe/Madrid")
  })

  it("navigates to the tracker on a successful submit", async () => {
    mockMe("Sam")

    mockMutateAsync.mockResolvedValueOnce(undefined)

    render(<NonOwnerWelcome />)

    fireEvent.click(screen.getByRole("button", { name: "Start tracking" }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"))
    expect(mockMutateAsync).toHaveBeenCalledTimes(1)
    // No inline error on success.
    expect(
      screen.queryByText("That timezone is not recognized.")
    ).not.toBeInTheDocument()
  })
})
