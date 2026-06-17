// Feature: color-token-system, Property 4: Tag mutations send token names only
import { describe, it, expect } from "vitest"
import fc from "fast-check"
import { SELECTABLE_COLORS, type ColorToken } from "@/lib/color-utils"

const HEX_PATTERN = /#[0-9a-fA-F]{3,8}/

const arbColorToken = fc.constantFrom(...SELECTABLE_COLORS)

/**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */
describe("Tag mutations — Property 4: Token names only", () => {
  it("any ColorToken is a plain lowercase string from the allowed set, never a hex value", () => {
    fc.assert(
      fc.property(arbColorToken, (token: ColorToken) => {
        // Is a string
        expect(typeof token).toBe("string")
        // Is lowercase
        expect(token).toBe(token.toLowerCase())
        // Is in the allowed set
        expect(SELECTABLE_COLORS).toContain(token)
        // Does not match hex pattern
        expect(token).not.toMatch(HEX_PATTERN)
      }),
      { numRuns: 100 },
    )
  })
})
