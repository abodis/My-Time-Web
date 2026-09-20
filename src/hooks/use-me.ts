import { useQuery } from "@tanstack/react-query"
import { client } from "@/api/client"
import { queryKeys } from "@/api/query-keys"

// Aggregate identity for app entry (user, accounts, onboarding status).
// Account-agnostic: the API client omits X-Account-Id for GET /me.
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me.all(),
    queryFn: async () => {
      const { data, error } = await client.GET("/me")
      if (error) throw error
      return data
    },
  })
}
