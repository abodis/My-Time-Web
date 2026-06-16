import { useQuery } from "@tanstack/react-query"
import { client } from "@/api/client"

export function usePersonalTimeReport({ from, to, groupBy }: {
  from: string; to: string; groupBy: "tag" | "activity"
}) {
  return useQuery({
    queryKey: ["reports", "personal-time", { from, to, groupBy }],
    queryFn: async () => {
      const { data, error } = await client.GET("/reports/personal-time", {
        params: { query: { from, to, groupBy } },
      })
      if (error) throw error
      return data
    },
    placeholderData: (prev) => prev,
  })
}

export function useProjectBudgetReport({ from, to, projectId }: {
  from: string; to: string; projectId?: string
}) {
  return useQuery({
    queryKey: ["reports", "project-budget", { from, to, projectId }],
    queryFn: async () => {
      const { data, error } = await client.GET("/reports/project-budget", {
        params: { query: { from, to, projectId } },
      })
      if (error) throw error
      return data
    },
    placeholderData: (prev) => prev,
  })
}

export function useFinancialReport({ from, to, projectId }: {
  from: string; to: string; projectId?: string
}) {
  return useQuery({
    queryKey: ["reports", "financial", { from, to, projectId }],
    queryFn: async () => {
      const { data, error } = await client.GET("/reports/financial", {
        params: { query: { from, to, projectId } },
      })
      if (error) throw error
      return data
    },
    placeholderData: (prev) => prev,
  })
}
