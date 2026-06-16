import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { AccountPicker } from "../account-picker"
import type { AccountItem } from "../account-picker"

const mockAccounts: AccountItem[] = [
  { id: "acc-1", name: "Acme Corp", role: "admin", isOwner: true },
  { id: "acc-2", name: "Freelance", role: "user", isOwner: false },
  { id: "acc-3", name: "Consulting LLC", role: "manager", isOwner: false },
]

describe("AccountPicker", () => {
  it("renders all account names", () => {
    render(<AccountPicker accounts={mockAccounts} onSelect={vi.fn()} />)

    expect(screen.getByText("Acme Corp")).toBeInTheDocument()
    expect(screen.getByText("Freelance")).toBeInTheDocument()
    expect(screen.getByText("Consulting LLC")).toBeInTheDocument()
  })

  it("renders role badge for each account", () => {
    render(<AccountPicker accounts={mockAccounts} onSelect={vi.fn()} />)

    expect(screen.getByText("Admin")).toBeInTheDocument()
    expect(screen.getByText("User")).toBeInTheDocument()
    expect(screen.getByText("Manager")).toBeInTheDocument()
  })

  it("renders Owner badge only for owner accounts", () => {
    render(<AccountPicker accounts={mockAccounts} onSelect={vi.fn()} />)

    const ownerBadges = screen.getAllByText("Owner")
    expect(ownerBadges).toHaveLength(1)
  })

  it("calls onSelect with account id when card is clicked", () => {
    const onSelect = vi.fn()
    render(<AccountPicker accounts={mockAccounts} onSelect={onSelect} />)

    fireEvent.click(screen.getByText("Freelance"))

    expect(onSelect).toHaveBeenCalledWith("acc-2")
  })

  it("renders empty state when no accounts provided", () => {
    render(<AccountPicker accounts={[]} onSelect={vi.fn()} />)

    expect(screen.getByText("Select an Account")).toBeInTheDocument()
    expect(screen.queryByText("Owner")).not.toBeInTheDocument()
  })
})
