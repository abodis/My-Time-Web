import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import EntryModal from "../entry-modal"
import DeleteConfirmDialog from "../delete-confirm-dialog"

vi.mock("@/hooks/use-entries", () => ({
  useCreateEntry: () => ({ mutateAsync: vi.fn(), reset: vi.fn(), error: null }),
  useUpdateEntry: () => ({ mutateAsync: vi.fn(), reset: vi.fn(), error: null }),
  useDeleteEntry: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("@/hooks/use-projects", () => ({
  useProjects: () => ({ data: [] }),
  useActivities: () => ({ data: [] }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const mockEntry = {
  id: "entry-1",
  userId: "user-1",
  activityId: "activity-1",
  activityName: "Test Activity",
  projectId: "project-1",
  projectName: "Test Project",
  startTime: "2024-01-01T09:00:00.000Z",
  endTime: "2024-01-01T10:00:00.000Z",
  notes: null,
  createdAt: "2024-01-01T09:00:00.000Z",
  updatedAt: "2024-01-01T09:00:00.000Z",
}

describe("EntryModal accessibility", () => {
  it("renders with role='dialog' and aria-modal='true' when open", () => {
    render(<EntryModal mode="create" open={true} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("aria-modal", "true")
  })

  it("has aria-labelledby pointing to the dialog title", () => {
    render(<EntryModal mode="create" open={true} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    const dialog = screen.getByRole("dialog")
    const labelledBy = dialog.getAttribute("aria-labelledby")
    expect(labelledBy).toBeTruthy()

    const titleElement = document.getElementById(labelledBy!)
    expect(titleElement).toHaveTextContent("Add Entry")
  })

  it("pressing Escape calls onClose", () => {
    const onClose = vi.fn()
    render(<EntryModal mode="create" open={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    })

    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })

  it("moves focus inside the dialog when opened", () => {
    render(<EntryModal mode="create" open={true} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    const dialog = screen.getByRole("dialog")
    expect(dialog.contains(document.activeElement)).toBe(true)
  })
})

describe("DeleteConfirmDialog accessibility", () => {
  it("renders with role='dialog' and aria-modal='true' when open", () => {
    render(<DeleteConfirmDialog entry={mockEntry} open={true} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("aria-modal", "true")
  })

  it("has aria-labelledby pointing to the dialog title", () => {
    render(<DeleteConfirmDialog entry={mockEntry} open={true} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    const dialog = screen.getByRole("dialog")
    const labelledBy = dialog.getAttribute("aria-labelledby")
    expect(labelledBy).toBeTruthy()

    const titleElement = document.getElementById(labelledBy!)
    expect(titleElement).toHaveTextContent("Delete Entry")
  })

  it("pressing Escape calls onClose", () => {
    const onClose = vi.fn()
    render(<DeleteConfirmDialog entry={mockEntry} open={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    })

    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })

  it("moves focus inside the dialog when opened", () => {
    render(<DeleteConfirmDialog entry={mockEntry} open={true} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    const dialog = screen.getByRole("dialog")
    expect(dialog.contains(document.activeElement)).toBe(true)
  })
})
