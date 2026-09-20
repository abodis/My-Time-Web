import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

// Control the invite mutation so we can drive per-row resolve/reject
// deterministically and count fan-out calls.
const mockInvite = vi.fn()
vi.mock("@/hooks/use-members", () => ({
  useInviteMember: () => ({ mutateAsync: mockInvite, isPending: false }),
}))

// Real onboarding store — the step advances via getState().goTo("summary").
import { useOnboardingStore } from "@/stores/onboarding-store"
import { InviteStep } from "../invite-step"

function fillEmail(index: number, value: string) {
  fireEvent.change(screen.getByLabelText(`Email`, { selector: `#invite-email-${index}` }), {
    target: { value },
  })
}

describe("InviteStep fan-out", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useOnboardingStore.getState().reset()
  })

  it("(a) sends one invite per row and advances to summary when all succeed", async () => {
    mockInvite.mockResolvedValue({})

    render(<InviteStep />)

    // Add a second row, then fill both with valid emails.
    fireEvent.click(screen.getByRole("button", { name: /add another/i }))
    fillEmail(0, "one@example.com")
    fillEmail(1, "two@example.com")

    fireEvent.click(screen.getByRole("button", { name: /send invites/i }))

    // One mutation call per row (fan-out).
    await waitFor(() => expect(mockInvite).toHaveBeenCalledTimes(2))
    expect(mockInvite).toHaveBeenCalledWith({ email: "one@example.com", role: "user" })
    expect(mockInvite).toHaveBeenCalledWith({ email: "two@example.com", role: "user" })

    // All succeeded → advance to summary.
    await waitFor(() =>
      expect(useOnboardingStore.getState().step).toBe("summary")
    )
  })

  it("(b) on partial failure stays on the step, shows an error and per-row status", async () => {
    // First row resolves, second row rejects.
    mockInvite.mockImplementation(({ email }: { email: string }) =>
      email === "bad@example.com"
        ? Promise.reject({ message: "Server error" })
        : Promise.resolve({})
    )

    render(<InviteStep />)

    fireEvent.click(screen.getByRole("button", { name: /add another/i }))
    fillEmail(0, "good@example.com")
    fillEmail(1, "bad@example.com")

    fireEvent.click(screen.getByRole("button", { name: /send invites/i }))

    // Both rows attempted.
    await waitFor(() => expect(mockInvite).toHaveBeenCalledTimes(2))

    // Error surfaced and per-row status text shown.
    expect(await screen.findByText("Server error")).toBeInTheDocument()
    expect(screen.getByText("Invitation sent")).toBeInTheDocument()
    expect(screen.getByText("Could not send invitation")).toBeInTheDocument()

    // Did NOT advance to summary — the failure keeps the owner on the step.
    expect(useOnboardingStore.getState().step).not.toBe("summary")
  })

  it("(c) Skip advances to summary without calling the mutation", () => {
    render(<InviteStep />)

    fireEvent.click(screen.getByRole("button", { name: /skip/i }))

    expect(useOnboardingStore.getState().step).toBe("summary")
    expect(mockInvite).not.toHaveBeenCalled()
  })

  it("(d) blocks submit on an invalid email and does not call the mutation or advance", async () => {
    render(<InviteStep />)

    fillEmail(0, "not-an-email")
    fireEvent.submit(screen.getByRole("button", { name: /send invites/i }).closest("form")!)

    expect(
      await screen.findByText("Enter a valid email address")
    ).toBeInTheDocument()
    expect(mockInvite).not.toHaveBeenCalled()
    expect(useOnboardingStore.getState().step).not.toBe("summary")
  })
})
