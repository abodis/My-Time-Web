import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { ErrorBoundary } from "../error-boundary"

// Suppress React error boundary console output during tests.
// React 18 in jsdom logs errors via both console.error AND window error events.
let consoleErrorSpy: ReturnType<typeof vi.spyOn>
const originalOnError = window.onerror

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })
  window.onerror = () => true
  window.addEventListener("error", (e) => e.preventDefault(), { once: false })
})

afterEach(() => {
  consoleErrorSpy.mockRestore()
  window.onerror = originalOnError
})

// Module-level flag for controlling throw behavior
let shouldThrow = true

function ConditionalThrower() {
  if (shouldThrow) {
    throw new Error("Conditional error")
  }
  return <div>Child rendered successfully</div>
}

function AlwaysThrows(): JSX.Element {
  throw new Error("Always fails")
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    shouldThrow = true
  })

  it("catches render error and shows fallback", () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    )

    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
    expect(screen.queryByText("Child rendered successfully")).not.toBeInTheDocument()
  })

  it("retry resets and re-renders children", () => {
    render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>
    )

    // Fallback shown after first render throws
    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument()

    // Stop throwing before retry
    shouldThrow = false

    // Click retry
    fireEvent.click(screen.getByRole("button", { name: /try again/i }))

    // Children render successfully
    expect(screen.getByText("Child rendered successfully")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /something went wrong/i })).not.toBeInTheDocument()
  })

  it("re-throw shows fallback again (no infinite loop)", () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    )

    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument()

    // Click retry — child will throw again
    fireEvent.click(screen.getByRole("button", { name: /try again/i }))

    // Fallback displayed again without crashing
    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
  })

  it("button is keyboard accessible (native button element, focusable)", () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    )

    const button = screen.getByRole("button", { name: /try again/i })

    // Native <button> is inherently keyboard accessible
    expect(button.tagName).toBe("BUTTON")
    // Not explicitly disabled from tabbing
    expect(button).not.toHaveAttribute("tabindex", "-1")
    // Can receive focus
    button.focus()
    expect(document.activeElement).toBe(button)
  })
})
