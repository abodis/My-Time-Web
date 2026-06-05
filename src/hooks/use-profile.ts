import { useQuery } from "@tanstack/react-query"
import { client } from "@/api/client"

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await client.GET("/account/me")
      if (error) throw error
      return data
    },
  })
}
