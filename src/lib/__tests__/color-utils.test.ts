// Feature: color-token-system, Property 6: Color resolution priority and shade correctness
// Feature: color-token-system, Property 7: Palette unavailable fallback
import { describe, it, expect } from "vitest"
import fc from "fast-check"
import { resolveColor, SELECTABLE_COLORS, GREY_FALLBACK_HEX } from "@/lib/color-utils"
import type { Palette, ColorShades, GreyShades } from "@/hooks/use-palette"

/** Arbitrary: valid hex color string */
const arbHexColor = fc
  .array(fc.integer({ min: 0, max: 15 }), { minLength: 6, maxLength: 6 })
  .map((digits) => `#${digits.map((d) => d.toString(16)).join("")}`)

/** Arbitrary: ColorShades { dark, normal, light } */
const arbColorShades: fc.Arbitrary<ColorShades> = fc.record({
  dark: arbHexColor,
  normal: arbHexColor,
  light: arbHexColor,
})

/** Arbitrary: GreyShades { darkest, dark, normal, light, lighter, lightest } */
const arbGreyShades: fc.Arbitrary<GreyShades> = fc.record({
  darkest: arbHexColor,
  dark: arbHexColor,
  normal: arbHexColor,
  light: arbHexColor,
  lighter: arbHexColor,
  lightest: arbHexColor,
})

/** Arbitrary: valid Palette with all 7 color tokens + grey */
const arbPalette: fc.Arbitrary<Palette> = fc
  .tuple(
    arbColorShades, // blue
    arbColorShades, // green
    arbColorShades, // red
    arbColorShades, // yellow
    arbColorShades, // orange
    arbColorShades, // teal
    arbColorShades, // purple
    arbGreyShades, // grey
  )
  .map(([blue, green, red, yellow, orange, teal, purple, grey]) => ({
    blue,
    green,
    red,
    yellow,
    orange,
    teal,
    purple,
    grey,
  })) as fc.Arbitrary<Palette>

/** Arbitrary: picks one of the 7 selectable color tokens */
const arbColorToken = fc.constantFrom(...SELECTABLE_COLORS)

/** Arbitrary: optional token (token | null) for override/tagColor */
const arbOptionalToken = fc.option(arbColorToken, { nil: null })

/**
 * **Validates: Requirements 5.1, 5.2, 5.3, 6.1, 6.2, 6.3**
 */
describe("resolveColor — Property 6: Color resolution priority and shade correctness", () => {
  it("Property 6a: override takes priority over tagColor", () => {
    fc.assert(
      fc.property(arbPalette, arbColorToken, arbOptionalToken, (palette, override, tagColor) => {
        const result = resolveColor(palette, override, tagColor)
        const expected = palette[override]
        expect(result.dark).toBe(expected.dark)
        expect(result.normal).toBe(expected.normal)
        expect(result.light).toBe(expected.light)
      }),
      { numRuns: 100 },
    )
  })

  it("Property 6b: when override is null, tagColor is used", () => {
    fc.assert(
      fc.property(arbPalette, arbColorToken, (palette, tagColor) => {
        const result = resolveColor(palette, null, tagColor)
        const expected = palette[tagColor]
        expect(result.dark).toBe(expected.dark)
        expect(result.normal).toBe(expected.normal)
        expect(result.light).toBe(expected.light)
      }),
      { numRuns: 100 },
    )
  })

  it("Property 6c: when both are null, falls back to grey shades", () => {
    fc.assert(
      fc.property(arbPalette, (palette) => {
        const result = resolveColor(palette, null, null)
        expect(result.dark).toBe(palette.grey.dark)
        expect(result.normal).toBe(palette.grey.normal)
        expect(result.light).toBe(palette.grey.light)
      }),
      { numRuns: 100 },
    )
  })

  it("Property 6d: for any resolved token, shades match palette exactly", () => {
    fc.assert(
      fc.property(arbPalette, arbOptionalToken, arbOptionalToken, (palette, override, tagColor) => {
        const result = resolveColor(palette, override, tagColor)
        const token = override ?? tagColor ?? "grey"
        const expected = palette[token]
        expect(result.dark).toBe(expected.dark)
        expect(result.normal).toBe(expected.normal)
        expect(result.light).toBe(expected.light)
      }),
      { numRuns: 100 },
    )
  })
})

/**
 * **Validates: Requirements 6.5**
 */
describe("resolveColor — palette unavailable fallback", () => {
  it("Property 7: when palette is undefined, all shades return #B2B2B2 for any override/tagColor combination", () => {
    fc.assert(
      fc.property(arbOptionalToken, arbOptionalToken, (override, tagColor) => {
        const result = resolveColor(undefined, override, tagColor)

        expect(result).toEqual({
          dark: GREY_FALLBACK_HEX,
          normal: GREY_FALLBACK_HEX,
          light: GREY_FALLBACK_HEX,
        })
      }),
      { numRuns: 100 },
    )
  })
})
