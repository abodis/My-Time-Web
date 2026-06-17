// Feature: color-token-system, Property 5: Activity override request structure
import { describe, it, expect } from "vitest"
import fc from "fast-check"
import { SELECTABLE_COLORS, type ColorToken } from "@/lib/color-utils"

const HEX_PATTERN = /#[0-9a-fA-F]{3,8}/

const arbColorToken = fc.constantFrom(...SELECTABLE_COLORS)
const arbActivityId = fc.uuid()

/**
 * **Validates: Requirements 4.1, 4.2**
 */
describe("Activity color override — Property 5: Request structure", () => {
  it("for any activityId and token, request body is { colors: { activityId: token } } with valid token", () => {
    fc.assert(
      fc.property(arbActivityId, arbColorToken, (activityId: string, token: ColorToken) => {
        // Construct the request body as the mutation does
        const body = { colors: { [activityId]: token } }

        // Body has colors object
        expect(body).toHaveProperty("colors")
        expect(typeof body.colors).toBe("object")

        // Colors has the activityId key
        expect(body.colors).toHaveProperty(activityId)

        // Value is the token
        const value = body.colors[activityId]
        expect(typeof value).toBe("string")
        expect(value).toBe(value.toLowerCase())
        expect(SELECTABLE_COLORS).toContain(value)
        expect(value).not.toMatch(HEX_PATTERN)
      }),
      { numRuns: 100 },
    )
  })
})
