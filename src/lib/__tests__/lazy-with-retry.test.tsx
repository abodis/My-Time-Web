import { Suspense } from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { lazyWithRetry } from "../lazy-with-retry"
import { ErrorBoundary } from "@/components/error-boundary"

let consoleErrorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.useFakeTimers()
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })
})

afterEach(() => {
  vi.useRealTimers()
  consoleErrorSpy.mockRestore()
})

describe("lazyWithRetry", () => {
  it("succeeds after 1 failure (retry works)", async () => {
    let calls = 0
    const factory = () => {
      calls++
      if (calls === 1) return Promise.reject(new Error("network error"))
      return Promise.resolve({
        default: () => <div>Loaded</div>,
      })
    }

    const LazyComponent = lazyWithRetry(factory)

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>,
    )

    expect(screen.getByText("Loading...")).toBeInTheDocument()

    // Advance past the 1s retry delay
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })

    expect(screen.getByText("Loaded")).toBeInTheDocument()
    expect(calls).toBe(2)
  })

  it("fails after 3 total failures (retries exhausted)", async () => {
    const factory = () => Promise.reject(new Error("network error"))

    const LazyComponent = lazyWithRetry(factory)

    render(
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </Suspense>
      </ErrorBoundary>,
    )

    expect(screen.getByText("Loading...")).toBeInTheDocument()

    // Advance past both retry delays (1s + 1s)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })

    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument()
  })
})
