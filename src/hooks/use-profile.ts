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
