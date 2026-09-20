import { useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import { queryKeys } from "@/api/query-keys"
import type { components } from "@/api/schema"

type OnboardingRequest = components["schemas"]["OnboardingRequest"]
type LightOnboardingRequest = components["schemas"]["LightOnboardingRequest"]

export function useCompleteOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: OnboardingRequest) => {
      const { data, error } = await client.POST("/onboarding", { body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.account.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all() })
    },
  })
}

export function useCompleteLightOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: LightOnboardingRequest) => {
      const { data, error } = await client.POST("/onboarding/light", { body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all() })
    },
  })
}

/** Thrown when POST /onboarding/example-project returns 409 (already seeded). */
export interface SeedConflictError {
  code: "already_seeded"
}

export function isSeedConflict(error: unknown): error is SeedConflictError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "already_seeded"
  )
}

/** Wall-clock cap for the seed request (design.md Req 5.4). */
const SEED_TIMEOUT_MS = 30_000

export function useSeedExampleProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data, error, response } = await client.POST(
        "/onboarding/example-project",
        { signal: AbortSignal.timeout(SEED_TIMEOUT_MS) }
      )
      if (error) {
        // Second call → 409 conflict. Surface a typed marker so the seeder can
        // treat "already seeded" as success (design.md Req 5.3).
        if (response.status === 409) {
          const conflict: SeedConflictError = { code: "already_seeded" }
          throw conflict
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all() })
    },
  })
}
