import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import type { components } from "@/api/schema"

type BudgetCreateRequest = components["schemas"]["BudgetCreateRequest"]
type BudgetUpdateRequest = components["schemas"]["BudgetUpdateRequest"]

export function useBudgets(projectId: string) {
  return useQuery({
    queryKey: ["budgets", projectId],
    queryFn: async () => {
      const { data, error } = await client.GET("/projects/{id}/budgets", {
        params: { path: { id: projectId } },
      })
      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, body }: { projectId: string; body: BudgetCreateRequest }) => {
      const { data, error } = await client.POST("/projects/{id}/budgets", {
        params: { path: { id: projectId } },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.projectId] })
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, budgetId, body }: { projectId: string; budgetId: string; body: BudgetUpdateRequest }) => {
      const { data, error } = await client.PUT("/projects/{id}/budgets/{budgetId}", {
        params: { path: { id: projectId, budgetId } },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.projectId] })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, budgetId }: { projectId: string; budgetId: string }) => {
      const { error } = await client.DELETE("/projects/{id}/budgets/{budgetId}", {
        params: { path: { id: projectId, budgetId } },
      })
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.projectId] })
    },
  })
}
