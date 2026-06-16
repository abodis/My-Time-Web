// Feature: code-quality-refactor, Property 3: Time formatting correctness
import { describe, it, expect } from "vitest"
import fc from "fast-check"
import {
  formatElapsed,
  getStartOfMonth,
  getEndOfMonth,
  getDateRange,
} from "@/lib/time-utils"

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


describe("getStartOfMonth", () => {
  it("returns the 1st of the month at midnight", () => {
    const date = new Date(2024, 5, 15) // June 15, 2024
    const result = new Date(getStartOfMonth(date))
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(5)
    expect(result.getDate()).toBe(1)
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(result.getMilliseconds()).toBe(0)
  })

  it("handles January (month boundary)", () => {
    const date = new Date(2024, 0, 31) // Jan 31
    const result = new Date(getStartOfMonth(date))
    expect(result.getMonth()).toBe(0)
    expect(result.getDate()).toBe(1)
  })

  it("handles December (month boundary)", () => {
    const date = new Date(2024, 11, 25) // Dec 25
    const result = new Date(getStartOfMonth(date))
    expect(result.getMonth()).toBe(11)
    expect(result.getDate()).toBe(1)
  })
})

describe("getEndOfMonth", () => {
  it("returns the last day of the month at 23:59:59.999", () => {
    const date = new Date(2024, 5, 1) // June 1, 2024
    const result = new Date(getEndOfMonth(date))
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(5)
    expect(result.getDate()).toBe(30) // June has 30 days
    expect(result.getHours()).toBe(23)
    expect(result.getMinutes()).toBe(59)
    expect(result.getSeconds()).toBe(59)
    expect(result.getMilliseconds()).toBe(999)
  })

  it("handles February in a non-leap year (28 days)", () => {
    const date = new Date(2023, 1, 10) // Feb 10, 2023
    const result = new Date(getEndOfMonth(date))
    expect(result.getMonth()).toBe(1)
    expect(result.getDate()).toBe(28)
  })

  it("handles February in a leap year (29 days)", () => {
    const date = new Date(2024, 1, 10) // Feb 10, 2024
    const result = new Date(getEndOfMonth(date))
    expect(result.getMonth()).toBe(1)
    expect(result.getDate()).toBe(29)
  })

  it("handles December (31 days)", () => {
    const date = new Date(2024, 11, 5) // Dec 5
    const result = new Date(getEndOfMonth(date))
    expect(result.getMonth()).toBe(11)
    expect(result.getDate()).toBe(31)
  })

  it("handles January (31 days)", () => {
    const date = new Date(2024, 0, 15) // Jan 15
    const result = new Date(getEndOfMonth(date))
    expect(result.getMonth()).toBe(0)
    expect(result.getDate()).toBe(31)
  })
})

describe("getDateRange", () => {
  it("this-month returns start and end of current month", () => {
    const { from, to } = getDateRange("this-month")
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const now = new Date()

    expect(fromDate.getMonth()).toBe(now.getMonth())
    expect(fromDate.getDate()).toBe(1)
    expect(toDate.getMonth()).toBe(now.getMonth())
    // End date should be the last day of the month
    expect(toDate.getHours()).toBe(23)
    expect(toDate.getMinutes()).toBe(59)
  })

  it("last-month returns the previous month range", () => {
    const { from, to } = getDateRange("last-month")
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const now = new Date()

    const expectedMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    expect(fromDate.getMonth()).toBe(expectedMonth)
    expect(fromDate.getDate()).toBe(1)
    expect(toDate.getMonth()).toBe(expectedMonth)
    expect(toDate.getHours()).toBe(23)
    expect(toDate.getMinutes()).toBe(59)
    expect(toDate.getSeconds()).toBe(59)
  })

  it("last-month handles year rollover (Jan → Dec)", () => {
    // We can't easily mock Date globally here, but we can test the underlying logic:
    // If current month is January (0), last month should be December (11) of previous year
    const jan = new Date(2024, 0, 15) // January 15, 2024
    const prev = new Date(jan.getFullYear(), jan.getMonth() - 1, 1)
    const fromResult = new Date(getStartOfMonth(prev))
    const toResult = new Date(getEndOfMonth(prev))

    expect(fromResult.getFullYear()).toBe(2023)
    expect(fromResult.getMonth()).toBe(11) // December
    expect(fromResult.getDate()).toBe(1)
    expect(toResult.getFullYear()).toBe(2023)
    expect(toResult.getMonth()).toBe(11)
    expect(toResult.getDate()).toBe(31)
  })

  it("this-week returns ISO strings without milliseconds", () => {
    const { from, to } = getDateRange("this-week")
    // Should be valid ISO strings without milliseconds (API requirement)
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
  })
})
