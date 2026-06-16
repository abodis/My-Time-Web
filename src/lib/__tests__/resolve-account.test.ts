// Feature: multi-account-integration, Property 1: Account resolution logic
import { describe, it, expect } from "vitest"
import fc from "fast-check"
import { resolveAccount, type AccountItem } from "@/lib/resolve-account"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Arbitrary that generates a valid UUID v4-shaped string */
const arbUuid = fc.uuid().map((u) => u.toLowerCase())

/** Arbitrary that generates an AccountItem with a valid UUID id */
const arbAccountItem: fc.Arbitrary<AccountItem> = fc.record({
  id: arbUuid,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  role: fc.constantFrom("user", "manager", "admin"),
  isOwner: fc.boolean(),
})

/**
 * **Validates: Requirements 2.1, 2.2, 2.3, 3.1, 4.1, 4.2, 4.3, 4.4**
 */
describe("resolveAccount", () => {
  it("Property 1a: single account → autoSelect with that account's id", () => {
    fc.assert(
      fc.property(
        arbAccountItem,
        fc.option(fc.string(), { nil: undefined }),
        (account, lastAccountId) => {
          const result = resolveAccount([account], lastAccountId ?? null)
          expect(result).toEqual({ action: "autoSelect", accountId: account.id })
        },
      ),
      { numRuns: 100 },
    )
  })

  it("Property 1b: 2+ accounts + valid UUID in list → autoSelect", () => {
    fc.assert(
      fc.property(
        fc.array(arbAccountItem, { minLength: 2, maxLength: 10 }),
        fc.nat(),
        (accounts, indexSeed) => {
          const idx = indexSeed % accounts.length
          const lastAccountId = accounts[idx].id

          const result = resolveAccount(accounts, lastAccountId)
          expect(result).toEqual({ action: "autoSelect", accountId: lastAccountId })
        },
      ),
      { numRuns: 100 },
    )
  })

  it("Property 1c: 2+ accounts + lastAccountId absent → showPicker", () => {
    fc.assert(
      fc.property(
        fc.array(arbAccountItem, { minLength: 2, maxLength: 10 }),
        (accounts) => {
          expect(resolveAccount(accounts, null)).toEqual({ action: "showPicker" })
          expect(resolveAccount(accounts, undefined)).toEqual({ action: "showPicker" })
        },
      ),
      { numRuns: 100 },
    )
  })

  it("Property 1d: 2+ accounts + invalid UUID → showPicker", () => {
    fc.assert(
      fc.property(
        fc.array(arbAccountItem, { minLength: 2, maxLength: 10 }),
        fc.string().filter((s) => !UUID_REGEX.test(s)),
        (accounts, invalidId) => {
          const result = resolveAccount(accounts, invalidId)
          expect(result).toEqual({ action: "showPicker" })
        },
      ),
      { numRuns: 100 },
    )
  })

  it("Property 1e: 2+ accounts + valid UUID NOT in list → showPicker", () => {
    fc.assert(
      fc.property(
        fc.array(arbAccountItem, { minLength: 2, maxLength: 10 }),
        arbUuid,
        (accounts, uuid) => {
          // Ensure UUID is not in the list
          fc.pre(!accounts.some((a) => a.id === uuid))

          const result = resolveAccount(accounts, uuid)
          expect(result).toEqual({ action: "showPicker" })
        },
      ),
      { numRuns: 100 },
    )
  })

  // Unit tests for edge cases
  it("empty accounts list → showPicker", () => {
    expect(resolveAccount([], null)).toEqual({ action: "showPicker" })
    expect(resolveAccount([], "550e8400-e29b-41d4-a716-446655440000")).toEqual({
      action: "showPicker",
    })
  })
})
