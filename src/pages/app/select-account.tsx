import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { client } from "@/api/client"
import { clearAuth } from "@/lib/auth"
import { resolveAccount } from "@/lib/resolve-account"
import { useAccountStore } from "@/stores/account-store"
import { AccountPicker } from "@/components/account/account-picker"
import type { AccountItem } from "@/stores/account-store"

export default function SelectAccountPage() {
  const navigate = useNavigate()
  const [accounts, setAccountsList] = useState<AccountItem[] | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    async function fetchAndResolve() {
      const { data, error } = await client.GET("/accounts")

      if (error || !data || data.length === 0) {
        clearAuth()
        navigate("/login", { replace: true })
        return
      }

      const result = resolveAccount(data, localStorage.getItem("lastAccountId"))

      if (result.action === "autoSelect") {
        useAccountStore.getState().setActiveAccount(result.accountId)
        useAccountStore.getState().setAccounts(data)
        navigate("/", { replace: true })
      } else {
        setAccountsList(data)
        setShowPicker(true)
      }
    }

    fetchAndResolve()
  }, [navigate])

  function handleSelect(accountId: string) {
    if (!accounts) return
    useAccountStore.getState().setActiveAccount(accountId)
    useAccountStore.getState().setAccounts(accounts)
    navigate("/", { replace: true })
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
