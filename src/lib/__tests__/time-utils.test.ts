// Feature: code-quality-refactor, Property 3: Time formatting correctness
import { describe, it, expect } from "vitest"
import fc from "fast-check"
import { formatElapsed } from "@/lib/time-utils"

/**
 * **Validates: Requirements 9.4**
 *
 * For any non-negative integer milliseconds value, formatElapsed(ms) SHALL produce
 * a string "HH:MM:SS" where parsing back yields hours * 3600 + minutes * 60 + seconds
 * === Math.floor(ms / 1000), each segment is zero-padded to 2 digits, and minutes and
 * seconds are each in range [0, 59].
 */
describe("formatElapsed", () => {
  it(
    "Property 3: round-trip — parsing HH:MM:SS back yields Math.floor(ms / 1000) total seconds",
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 360_000_000 }),
          (ms) => {
            const result = formatElapsed(ms)

            // Output matches format XX:XX:XX (hours can be 2+ digits)
            expect(result).toMatch(/^\d{2,}:\d{2}:\d{2}$/)

            // Parse segments
            const parts = result.split(":")
            const hours = parseInt(parts[0], 10)
            const minutes = parseInt(parts[1], 10)
            const seconds = parseInt(parts[2], 10)

            // Round-trip: total seconds matches Math.floor(ms / 1000)
            const totalSeconds = hours * 3600 + minutes * 60 + seconds
            expect(totalSeconds).toBe(Math.floor(ms / 1000))
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "Property 3: range constraints — minutes and seconds in [0, 59]",
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 360_000_000 }),
          (ms) => {
            const result = formatElapsed(ms)
            const parts = result.split(":")
            const minutes = parseInt(parts[1], 10)
            const seconds = parseInt(parts[2], 10)

            expect(minutes).toBeGreaterThanOrEqual(0)
            expect(minutes).toBeLessThanOrEqual(59)
            expect(seconds).toBeGreaterThanOrEqual(0)
            expect(seconds).toBeLessThanOrEqual(59)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "Property 3: zero-padding — each segment is at least 2 digits",
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 360_000_000 }),
          (ms) => {
            const result = formatElapsed(ms)
            const parts = result.split(":")

            // Each segment is at least 2 characters (zero-padded)
            for (const part of parts) {
              expect(part.length).toBeGreaterThanOrEqual(2)
            }
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
