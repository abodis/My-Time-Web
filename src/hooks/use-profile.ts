import { useQuery } from "@tanstack/react-query"
import { client } from "@/api/client"
import { queryKeys } from "@/api/query-keys"
import { useAccountStore } from "@/stores/account-store"

export function useProfile() {
  // Account-scoped: gate on an active account so the request never fires before
  // the account store is hydrated (else the client omits X-Account-Id → 400
  // missing_account_id, which triggers a redirect/reload loop).
  const activeAccountId = useAccountStore((s) => s.activeAccountId)
  return useQuery({
    queryKey: queryKeys.profile.all(),
    queryFn: async () => {
      const { data, error } = await client.GET("/account/me")
      if (error) throw error
      return data
    },
    enabled: !!activeAccountId,
  })
}

// Account-level info (name, currency). Separate from /account/me, which is the
// current user's profile and does not carry the account currency.
export function useAccount() {
  // Account-scoped — same gate as useProfile (see above).
  const activeAccountId = useAccountStore((s) => s.activeAccountId)
  return useQuery({
    queryKey: queryKeys.account.all(),
    queryFn: async () => {
      const { data, error } = await client.GET("/account")
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!activeAccountId,
  })
}
