import { useQuery } from "@tanstack/react-query"
import { client } from "@/api/client"
import { queryKeys } from "@/api/query-keys"

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.all(),
    queryFn: async () => {
      const { data, error } = await client.GET("/account/me")
      if (error) throw error
      return data
    },
  })
}

// Account-level info (name, currency). Separate from /account/me, which is the
// current user's profile and does not carry the account currency.
export function useAccount() {
  return useQuery({
    queryKey: queryKeys.account.all(),
    queryFn: async () => {
      const { data, error } = await client.GET("/account")
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
