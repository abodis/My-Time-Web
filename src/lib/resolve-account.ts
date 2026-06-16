export interface AccountItem {
  id: string
  name: string
  role: string
  isOwner: boolean
}

export type ResolveResult =
  | { action: "autoSelect"; accountId: string }
  | { action: "showPicker" }

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_REGEX.test(value)
}

export function resolveAccount(
  accounts: AccountItem[],
  lastAccountId: string | null | undefined
): ResolveResult {
  if (accounts.length === 1) {
    return { action: "autoSelect", accountId: accounts[0].id }
  }

  if (
    accounts.length >= 2 &&
    isValidUuid(lastAccountId) &&
    accounts.some((a) => a.id === lastAccountId)
  ) {
    return { action: "autoSelect", accountId: lastAccountId }
  }

  return { action: "showPicker" }
}
