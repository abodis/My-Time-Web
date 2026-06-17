import { useQuery } from "@tanstack/react-query"
import { client } from "@/api/client"

export type ColorShades = { dark: string; normal: string; light: string }
export type GreyShades = {
  darkest: string
  dark: string
  normal: string
  light: string
  lighter: string
  lightest: string
}
export type Palette = Record<string, ColorShades> & { grey: GreyShades }

export function usePalette() {
  return useQuery({
    queryKey: ["palette"],
    queryFn: async () => {
      const { data, error } = await client.GET("/palette")
      if (error) throw error
      return data as Palette
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    retryDelay: 2000,
  })
}
