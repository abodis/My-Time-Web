import { useQuery } from "@tanstack/react-query"
import { client } from "@/api/client"

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await client.GET("/projects")
      if (error) throw error
      return data
    },
  })
}

export function useActivities(projectId: string) {
  return useQuery({
    queryKey: ["activities", projectId],
    queryFn: async () => {
      const { data, error } = await client.GET("/projects/{id}/activities", {
        params: { path: { id: projectId } },
      })
      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}
