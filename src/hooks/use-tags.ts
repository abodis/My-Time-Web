import { useQuery } from "@tanstack/react-query"
import { client } from "@/api/client"

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await client.GET("/tags")
      if (error) throw error
      return data
    },
  })
}
