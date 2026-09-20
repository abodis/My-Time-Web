import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import type { components } from "@/api/schema"

type MeResponse = components["schemas"]["MeResponse"]

// Control the mutation hook so we can drive success / rejection deterministically.
const mockMutateAsync = vi.fn()
vi.mock("@/hooks/use-onboarding", () => ({
  useCompleteOnboarding: () => ({ mutateAsync: mockMutateAsync }),
}))

import { ProfileStep } from "../profile-step"

const me: MeResponse = {
  user: {
    id: "user-1",
    email: "alex@demo.test",
    displayName: "Alex Doe",
    timezone: "Europe/Madrid",
    avatar: null,
  },
  accounts: [{ id: "acc-1", name: "Acme", role: "admin", isOwner: true }],
  onboarding: { completed: false, completedAt: null },
} as MeResponse

describe("ProfileStep error branches", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("blocks submit on empty displayName: shows field error, never calls the mutation or onCompleted", async () => {
    const onCompleted = vi.fn()
    render(<ProfileStep me={me} onCompleted={onCompleted} />)

    // Clear the pre-filled name so Zod min(1) fails client-side.
    const nameInput = screen.getByLabelText("Your name")
    fireEvent.change(nameInput, { target: { value: "" } })

    fireEvent.click(screen.getByRole("button", { name: /continue/i }))

    // Field-level validation message surfaces.
    expect(await screen.findByText("Enter your name")).toBeInTheDocument()
    // Mutation and advance never happen.
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(onCompleted).not.toHaveBeenCalled()
  })

  it("surfaces a 400 { type, message, fields } API error inline and does NOT advance", async () => {
    const onCompleted = vi.fn()
    mockMutateAsync.mockRejectedValue({
      type: "invalid_format",
      message: "That currency isn't supported",
      fields: ["currency"],
    })

    render(<ProfileStep me={me} onCompleted={onCompleted} />)

    // Defaults are valid (name pre-filled, timezone resolved, currency[0]).
    fireEvent.click(screen.getByRole("button", { name: /continue/i }))

    // The mutation was attempted...
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))
    // ...its error message is rendered inline...
    expect(
      await screen.findByText("That currency isn't supported")
    ).toBeInTheDocument()
    // ...and the wizard does NOT advance.
    expect(onCompleted).not.toHaveBeenCalled()
  })

  it("calls onCompleted once when the submit succeeds", async () => {
    const onCompleted = vi.fn()
    mockMutateAsync.mockResolvedValue({})

    render(<ProfileStep me={me} onCompleted={onCompleted} />)

    fireEvent.click(screen.getByRole("button", { name: /continue/i }))

    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1))
    expect(mockMutateAsync).toHaveBeenCalledTimes(1)
  })
})
