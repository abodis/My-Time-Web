// Feature: code-quality-refactor, Property 1: Elapsed map accumulation is correct and idempotent
import { describe, it, expect } from "vitest"
import fc from "fast-check"
import { computeElapsedMap } from "@/hooks/use-tracker-data"
import type { components } from "@/api/schema"

type EntryResponse = components["schemas"]["EntryResponse"]

/**
 * Generates a small pool of activity IDs to ensure duplicates occur,
 * then builds random entry arrays referencing those IDs.
 */
function entryArbitrary(): fc.Arbitrary<EntryResponse[]> {
  // Timestamp range: 2020-01-01 to 2030-01-01 in ms
  const minTs = new Date("2020-01-01T00:00:00Z").getTime()
  const maxTs = new Date("2030-01-01T00:00:00Z").getTime()

  const activityIdPool = fc.array(fc.uuid(), { minLength: 1, maxLength: 5 })

  return activityIdPool.chain((activityIds) =>
    fc.array(
      fc.tuple(
        fc.uuid(),
        fc.uuid(),
        fc.constantFrom(...activityIds),
        fc.integer({ min: minTs, max: maxTs }),
        fc.integer({ min: 0, max: 86_400_000 }), // duration up to 24h in ms
      ),
      { minLength: 0, maxLength: 20 },
    ).map((tuples) =>
      tuples.map(([id, userId, activityId, startTs, duration]) => ({
        id,
        userId,
        activityId,
        startTime: new Date(startTs).toISOString(),
        endTime: new Date(startTs + duration).toISOString(),
      } as EntryResponse)),
    ),
  )
}

describe("computeElapsedMap", () => {
  it(
    "Property 1: sum correctness — each activityId maps to exact sum of durations",
    () => {
      fc.assert(
        fc.property(entryArbitrary(), (entries) => {
          const result = computeElapsedMap(entries)

          // Compute expected sums manually
          const expected = new Map<string, number>()
          for (const entry of entries) {
            if (entry.startTime && entry.endTime) {
              const duration = Date.parse(entry.endTime) - Date.parse(entry.startTime)
              expected.set(entry.activityId, (expected.get(entry.activityId) ?? 0) + duration)
            }
          }

          // Same keys
          expect(result.size).toBe(expected.size)

          // Same values per key
          for (const [key, value] of expected) {
            expect(result.get(key)).toBe(value)
          }
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "Property 1: idempotency — calling twice with same input produces identical Maps",
    () => {
      fc.assert(
        fc.property(entryArbitrary(), (entries) => {
          const result1 = computeElapsedMap(entries)
          const result2 = computeElapsedMap(entries)

          expect(result1.size).toBe(result2.size)
          for (const [key, value] of result1) {
            expect(result2.get(key)).toBe(value)
          }
        }),
        { numRuns: 100 },
      )
    },
  )
})
