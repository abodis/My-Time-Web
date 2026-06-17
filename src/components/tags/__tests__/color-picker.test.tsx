// Feature: color-token-system, Property 2: Exactly one selection indicator
// Feature: color-token-system, Property 3: ColorPicker value round-trip
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import fc from "fast-check"
import { SELECTABLE_COLORS, type ColorToken } from "@/lib/color-utils"
import type { Palette, ColorShades, GreyShades } from "@/hooks/use-palette"

vi.mock("@/hooks/use-palette")
import { usePalette } from "@/hooks/use-palette"
const mockUsePalette = vi.mocked(usePalette)

// Lazy import to allow mock to apply
import { ColorPicker } from "../color-picker"

function makePalette(): Palette {
  const shades = (hex: string): ColorShades => ({
    dark: `${hex}-dark`,
    normal: `${hex}-normal`,
    light: `${hex}-light`,
  })
  const grey: GreyShades = {
    darkest: "#111",
    dark: "#333",
    normal: "#999",
    light: "#bbb",
    lighter: "#ddd",
    lightest: "#eee",
  }
  return {
    blue: shades("#00f"),
    green: shades("#0f0"),
    red: shades("#f00"),
    yellow: shades("#ff0"),
    orange: shades("#f90"),
    teal: shades("#0ff"),
    purple: shades("#90f"),
    grey,
  } as Palette
}

const arbColorToken = fc.constantFrom(...SELECTABLE_COLORS)

/**
 * **Validates: Requirements 2.6, 2.7**
 */
describe("ColorPicker value round-trip (Property 3)", () => {
  beforeEach(() => {
    mockUsePalette.mockReturnValue({
      data: makePalette(),
      isLoading: false,
    } as ReturnType<typeof usePalette>)
  })

  it("Part 1: for any token passed as value, that swatch is aria-checked", () => {
    fc.assert(
      fc.property(arbColorToken, (token: ColorToken) => {
        const { unmount } = render(
          <ColorPicker value={token} onChange={vi.fn()} />,
        )
        const button = screen.getByRole("radio", { name: token })
        expect(button).toHaveAttribute("aria-checked", "true")
        unmount()
      }),
      { numRuns: 100 },
    )
  })

  it("Part 2: for any token clicked, onChange receives that exact token string", () => {
    fc.assert(
      fc.property(arbColorToken, (token: ColorToken) => {
        const onChange = vi.fn()
        const { unmount } = render(
          <ColorPicker value={null} onChange={onChange} />,
        )
        const button = screen.getByRole("radio", { name: token })
        fireEvent.click(button)
        expect(onChange).toHaveBeenCalledWith(token)
        unmount()
      }),
      { numRuns: 100 },
    )
  })
})


/**
 * **Validates: Requirements 2.3**
 */
describe("ColorPicker selection indicator (Property 2)", () => {
  beforeEach(() => {
    mockUsePalette.mockReturnValue({
      data: makePalette(),
      isLoading: false,
    } as ReturnType<typeof usePalette>)
  })

  it("for any selected token, exactly one radio has aria-checked=true and its aria-label matches", () => {
    fc.assert(
      fc.property(arbColorToken, (selectedToken: ColorToken) => {
        const { unmount } = render(
          <ColorPicker value={selectedToken} onChange={vi.fn()} />,
        )

        const radios = screen.getAllByRole("radio")

        // Exactly one radio should have aria-checked="true"
        const checkedRadios = radios.filter(
          (r) => r.getAttribute("aria-checked") === "true",
        )
        expect(checkedRadios).toHaveLength(1)

        // That radio's aria-label should match the selected token
        expect(checkedRadios[0].getAttribute("aria-label")).toBe(selectedToken)

        unmount()
      }),
      { numRuns: 100 },
    )
  })
})
