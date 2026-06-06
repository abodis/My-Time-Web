import { useQuery, useMutation } from "@tanstack/react-query"
import { client } from "@/api/client"

export function useCurrentTimer() {
  return useQuery({
    queryKey: ["timer", "current"],
    queryFn: async () => {
      const { data, error } = await client.GET("/timer/current")
      if (error) throw error
      return data
    },
  })
}

export function useStartTimer() {
  return useMutation({
    mutationFn: async (activityId: string) => {
      const attemptStart = () =>
        client.POST("/timer/start", { body: { activityId } })

      const initial = await attemptStart()
      let { data, error } = initial
      const { response } = initial

      // A timer is already running on the server (local state may be out of sync).
      // Stop it and retry the start so the click reliably switches activities.
      if (response.status === 409) {
        await client.POST("/timer/stop")
          ; ({ data, error } = await attemptStart())
      }

      if (error) throw error
      return data
    },
  })
}

export function useStopTimer() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await client.POST("/timer/stop")
      if (error) throw error
      return data
    },
  })
}
