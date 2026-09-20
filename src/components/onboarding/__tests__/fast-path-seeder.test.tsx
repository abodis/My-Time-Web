import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

// Control the seed mutation; re-export the real conflict predicate shape so the
// component's `isSeedConflict(err)` check works against `{ code: "already_seeded" }`.
const mockMutateAsync = vi.fn()
vi.mock("@/hooks/use-onboarding", () => ({
  useSeedExampleProject: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  isSeedConflict: (e: unknown) =>
    typeof e === "object" && e !== null && (e as { code?: unknown }).code === "already_seeded",
}))

import { FastPathSeeder } from "../fast-path-seeder"
import { useOnboardingStore } from "@/stores/onboarding-store"

describe("FastPathSeeder", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useOnboardingStore.getState().reset()
  })

  it("(a) seeds on mount; on 201 success marks seeded and advances to invite", async () => {
    mockMutateAsync.mockResolvedValue({})

    render(<FastPathSeeder />)

    // Fires the seed exactly once on mount.
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))

    // Store advanced + marked seeded.
    await waitFor(() => {
      expect(useOnboardingStore.getState().step).toBe("invite")
    })
    expect(useOnboardingStore.getState().seededExample).toBe(true)

    // Success UI shown, no error alert.
    expect(await screen.findByText("Your example project is ready.")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("(b) treats a 409 conflict as success: marks seeded, advances, shows no error", async () => {
    mockMutateAsync.mockRejectedValue({ code: "already_seeded" })

    render(<FastPathSeeder />)

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))

    await waitFor(() => {
      expect(useOnboardingStore.getState().step).toBe("invite")
    })
    expect(useOnboardingStore.getState().seededExample).toBe(true)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("(c) a non-409 failure shows a retryable error and does NOT advance; retry re-seeds and advances", async () => {
    mockMutateAsync.mockRejectedValueOnce({ message: "boom" })

    render(<FastPathSeeder />)

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))

    // Error surfaced, store NOT advanced, not seeded.
    expect(await screen.findByRole("alert")).toHaveTextContent("boom")
    expect(useOnboardingStore.getState().step).toBe("profile")
    expect(useOnboardingStore.getState().seededExample).toBe(false)

    // Retry now resolves.
    mockMutateAsync.mockResolvedValueOnce({})
    fireEvent.click(screen.getByRole("button", { name: /try again/i }))

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(2))
    await waitFor(() => {
      expect(useOnboardingStore.getState().step).toBe("invite")
    })
    expect(useOnboardingStore.getState().seededExample).toBe(true)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})
