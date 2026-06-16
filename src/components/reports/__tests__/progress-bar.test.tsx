import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { ProgressBar } from "../progress-bar"

describe("ProgressBar", () => {
  it("renders at correct width when under budget", () => {
    const { container } = render(
      <ProgressBar consumed={5} budget={10} />
    )
    const fill = container.querySelector("[role='progressbar'] > div") as HTMLElement
    expect(fill.style.width).toBe("50%")
  })

  it("renders green when under 80%", () => {
    const { container } = render(
      <ProgressBar consumed={5} budget={10} />
    )
    const fill = container.querySelector("[role='progressbar'] > div") as HTMLElement
    expect(fill.style.backgroundColor).toBe("rgb(34, 197, 94)")
  })

  it("renders yellow when 80-100%", () => {
    const { container } = render(
      <ProgressBar consumed={8.5} budget={10} />
    )
    const fill = container.querySelector("[role='progressbar'] > div") as HTMLElement
    expect(fill.style.backgroundColor).toBe("rgb(234, 179, 8)")
  })

  it("renders red when over 100%", () => {
    const { container } = render(
      <ProgressBar consumed={12} budget={10} />
    )
    const fill = container.querySelector("[role='progressbar'] > div") as HTMLElement
    expect(fill.style.backgroundColor).toBe("rgb(239, 68, 68)")
  })

  it("shows over-budget text and 100% width when consumed > budget", () => {
    const { container } = render(
      <ProgressBar consumed={12} budget={10} />
    )
    const fill = container.querySelector("[role='progressbar'] > div") as HTMLElement
    expect(fill.style.width).toBe("100%")
    expect(screen.getByText("12.0 / 10.0 hrs")).toBeInTheDocument()
  })

  it("renders 0% width when budget is null", () => {
    const { container } = render(
      <ProgressBar consumed={5} budget={null} />
    )
    const fill = container.querySelector("[role='progressbar'] > div") as HTMLElement
    expect(fill.style.width).toBe("0%")
  })

  it("renders 0% width when budget is zero", () => {
    const { container } = render(
      <ProgressBar consumed={5} budget={0} />
    )
    const fill = container.querySelector("[role='progressbar'] > div") as HTMLElement
    expect(fill.style.width).toBe("0%")
  })

  it("shows percentage label", () => {
    render(<ProgressBar consumed={5} budget={10} />)
    expect(screen.getByText("50%")).toBeInTheDocument()
  })

  it("shows >100% in label when over budget", () => {
    render(<ProgressBar consumed={12} budget={10} />)
    expect(screen.getByText("120%")).toBeInTheDocument()
  })

  it("has correct aria attributes", () => {
    render(<ProgressBar consumed={7} budget={20} />)
    const bar = screen.getByRole("progressbar")
    expect(bar).toHaveAttribute("aria-valuenow", "7")
    expect(bar).toHaveAttribute("aria-valuemin", "0")
    expect(bar).toHaveAttribute("aria-valuemax", "20")
  })

  it("sets aria-valuemax to 0 when budget is null", () => {
    render(<ProgressBar consumed={3} budget={null} />)
    const bar = screen.getByRole("progressbar")
    expect(bar).toHaveAttribute("aria-valuemax", "0")
  })
})
