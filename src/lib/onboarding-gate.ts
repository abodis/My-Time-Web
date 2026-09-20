import type { components } from "@/api/schema"

type MeResponse = components["schemas"]["MeResponse"]

/**
 * Where the entry gate should send the user after an account is resolved.
 * - "tracker": onboarding already completed
 * - "wizard": needs onboarding and owns the resolved account
 * - "welcome": needs onboarding and does not own the resolved account
 * - "stay": onboarding status absent/malformed — stay on account-resolution screen
 */
export type EntryTarget = "tracker" | "wizard" | "welcome" | "stay"

/**
 * Pure entry-gate decision. Totally determined by (onboarding.completed, isOwner)
 * of the resolved account. Accepts the resolved account id so the function stays
 * pure (no store/hook reads); the caller supplies the id it resolved.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 10.3, 10.4, 10.5
 */
export function resolveEntryTarget(
  me: MeResponse | undefined,
  resolvedAccountId: string | null | undefined
): EntryTarget {
  const completed = me?.onboarding?.completed

  if (typeof completed !== "boolean") {
    return "stay"
  }

  if (completed) {
    return "tracker"
  }

  const accounts = me?.accounts
  if (!Array.isArray(accounts)) {
    return "stay"
  }

  const account = accounts.find((a) => a.id === resolvedAccountId)
  if (!account || typeof account.isOwner !== "boolean") {
    return "stay"
  }

  return account.isOwner ? "wizard" : "welcome"
}
