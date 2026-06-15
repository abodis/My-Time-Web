import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import type { components } from "@/api/schema"

const MEMBERS_KEY = ["members"] as const

export function useMembers() {
  return useQuery({
    queryKey: MEMBERS_KEY,
    queryFn: async () => {
      const { data, error } = await client.GET("/account/members")
      if (error) throw error
      return data
    },
  })
}

type MemberInviteRequest = components["schemas"]["MemberInviteRequest"]

export function useInviteMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: MemberInviteRequest) => {
      const { data, error } = await client.POST("/account/members", { body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY })
    },
  })
}

type MemberUpdateRequest = components["schemas"]["MemberUpdateRequest"]

export function useUpdateMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, body }: { userId: string; body: MemberUpdateRequest }) => {
      const { data, error } = await client.PUT("/account/members/{userId}", {
        params: { path: { userId } },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY })
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await client.DELETE("/account/members/{userId}", {
        params: { path: { userId } },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY })
    },
  })
}
