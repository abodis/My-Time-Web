// Feature: onboarding-experience, Property 1: Entry-gate decision is totally determined by (completed, isOwner)
import { describe, it, expect } from "vitest"
import fc from "fast-check"
import { resolveEntryTarget, type EntryTarget } from "@/lib/onboarding-gate"
import type { components } from "@/api/schema"

type MeResponse = components["schemas"]["MeResponse"]

/** Arbitrary UUID-shaped id (lowercased). */
const arbUuid = fc.uuid().map((u) => u.toLowerCase())

/** A single MeAccount-shaped membership item. */
const arbAccount = fc.record({
  id: arbUuid,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  role: fc.constantFrom("user", "manager", "admin"),
  isOwner: fc.boolean(),
})

/** `completed` field: boolean, or absent/malformed (undefined, null, string, number). */
const arbCompleted = fc.oneof(
  fc.boolean(),
  fc.constant(undefined),
  fc.constant(null),
  fc.string(),
  fc.integer(),
)

/** nullable displayName per MeUser schema. */
const arbDisplayName = fc.option(fc.string({ maxLength: 40 }), { nil: null })

/**
 * A loosely-typed MeResponse-shaped object plus a resolvedAccountId.
 * `completed` may be non-boolean and accounts may be empty to exercise the
 * malformed/absent branches; the function defends against these at runtime.
 */
const arbInput = fc
  .record({
    completed: arbCompleted,
    displayName: arbDisplayName,
    accounts: fc.array(arbAccount, { minLength: 0, maxLength: 6 }),
    // resolvedAccountId: sometimes an existing account, sometimes a random
    // (likely not-in-list) UUID, sometimes null/undefined.
    idSeed: fc.oneof(fc.nat(), fc.constant(-1), fc.constant(-2)),
    strayId: arbUuid,
  })
  .map(({ completed, displayName, accounts, idSeed, strayId }) => {
    let resolvedAccountId: string | null | undefined
    if (idSeed === -1) resolvedAccountId = null
    else if (idSeed === -2) resolvedAccountId = undefined
    else if (accounts.length > 0 && idSeed % 3 !== 0) {
      resolvedAccountId = accounts[idSeed % accounts.length].id
    } else {
      resolvedAccountId = strayId // random UUID, likely not in list
    }

    const me = {
      user: {
        id: "u-1",
        email: "u@example.test",
        displayName,
        timezone: null,
        avatar: null,
      },
      accounts,
      onboarding: { completed, completedAt: null },
    } as unknown as MeResponse

    return { me, resolvedAccountId, completed, accounts }
  })

/** Independent oracle mirroring the documented semantics. */
function oracle(
  completed: unknown,
  accounts: { id: string; isOwner: boolean }[],
  resolvedAccountId: string | null | undefined,
): EntryTarget {
  if (typeof completed !== "boolean") return "stay"
  if (completed) return "tracker"
  const account = accounts.find((a) => a.id === resolvedAccountId)
  if (!account || typeof account.isOwner !== "boolean") return "stay"
  return account.isOwner ? "wizard" : "welcome"
}

/**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 10.3, 10.4, 10.5**
 */
describe("resolveEntryTarget", () => {
  it("Property 1: decision is totally determined by (completed, isOwner of resolved account)", () => {
    fc.assert(
      fc.property(arbInput, ({ me, resolvedAccountId, completed, accounts }) => {
        const result = resolveEntryTarget(me, resolvedAccountId)
        expect(result).toBe(oracle(completed, accounts, resolvedAccountId))
      }),
      { numRuns: 200 },
    )
  })

  // Explicit edge-case coverage (examples complement the property).
  const account = { id: "a-1", name: "A", role: "admin", isOwner: true }
  const nonOwner = { id: "a-2", name: "B", role: "user", isOwner: false }
  const base = {
    user: { id: "u", email: "e", displayName: null, timezone: null, avatar: null },
  }

  it("completed true → tracker (accounts/id irrelevant)", () => {
    const me = { ...base, accounts: [], onboarding: { completed: true, completedAt: null } } as unknown as MeResponse
    expect(resolveEntryTarget(me, null)).toBe("tracker")
  })

  it("completed absent/undefined → stay", () => {
    const me = { ...base, accounts: [account], onboarding: {} } as unknown as MeResponse
    expect(resolveEntryTarget(me, account.id)).toBe("stay")
  })

  it("me undefined → stay", () => {
    expect(resolveEntryTarget(undefined, "a-1")).toBe("stay")
  })

  it("completed false + resolved account isOwner true → wizard", () => {
    const me = { ...base, accounts: [account], onboarding: { completed: false, completedAt: null } } as unknown as MeResponse
    expect(resolveEntryTarget(me, account.id)).toBe("wizard")
  })

  it("completed false + resolved account isOwner false → welcome", () => {
    const me = { ...base, accounts: [nonOwner], onboarding: { completed: false, completedAt: null } } as unknown as MeResponse
    expect(resolveEntryTarget(me, nonOwner.id)).toBe("welcome")
  })

  it("completed false + resolvedAccountId not in list → stay", () => {
    const me = { ...base, accounts: [account], onboarding: { completed: false, completedAt: null } } as unknown as MeResponse
    expect(resolveEntryTarget(me, "missing-id")).toBe("stay")
  })

  it("completed false + empty accounts array → stay", () => {
    const me = { ...base, accounts: [], onboarding: { completed: false, completedAt: null } } as unknown as MeResponse
    expect(resolveEntryTarget(me, "a-1")).toBe("stay")
  })
})
