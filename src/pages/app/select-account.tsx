import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { client } from "@/api/client"
import { clearAuth } from "@/lib/auth"
import { resolveAccount } from "@/lib/resolve-account"
import { resolveEntryTarget } from "@/lib/onboarding-gate"
import { useMe } from "@/hooks/use-me"
import { useAccountStore } from "@/stores/account-store"
import { AccountPicker } from "@/components/account/account-picker"
import { paths } from "@/routes"
import type { AccountItem } from "@/stores/account-store"

export default function SelectAccountPage() {
  const navigate = useNavigate()
  const me = useMe()
  const [accounts, setAccountsList] = useState<AccountItem[] | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [resolvedAccountId, setResolvedAccountId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAndResolve() {
      const { data, error } = await client.GET("/accounts")

      if (error || !data || data.length === 0) {
        clearAuth()
        useAccountStore.getState().clearAccountState()
        navigate(paths.login, { replace: true })
        return
      }

      const result = resolveAccount(data, localStorage.getItem("lastAccountId"))

      if (result.action === "autoSelect") {
        useAccountStore.getState().setActiveAccount(result.accountId)
        useAccountStore.getState().setAccounts(data)
        setResolvedAccountId(result.accountId)
      } else {
        setAccountsList(data)
        setShowPicker(true)
      }
    }

    fetchAndResolve()
  }, [navigate])

  // Entry gate: once an account is resolved and /me has loaded, branch to the
  // tracker or onboarding. "stay" (missing/malformed onboarding status) keeps
  // the user on this screen. Guarded so it only navigates once me data is ready.
  useEffect(() => {
    if (resolvedAccountId === null || !me.data) return

    const target = resolveEntryTarget(me.data, resolvedAccountId)

    if (target === "tracker") {
      navigate(paths.tracker, { replace: true })
    } else if (target === "wizard" || target === "welcome") {
      navigate(paths.onboarding, { replace: true })
    }
  }, [resolvedAccountId, me.data, navigate])

  function handleSelect(accountId: string) {
    if (!accounts) return
    useAccountStore.getState().setActiveAccount(accountId)
    useAccountStore.getState().setAccounts(accounts)
    setShowPicker(false)
    setResolvedAccountId(accountId)
  }

  if (showPicker && accounts) {
    return <AccountPicker accounts={accounts} onSelect={handleSelect} />
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--muted))] border-t-[hsl(var(--primary))]"
        aria-label="Loading accounts"
        role="status"
      />
    </div>
  )
}
