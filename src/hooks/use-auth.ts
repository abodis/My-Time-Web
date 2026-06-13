import { useMutation } from "@tanstack/react-query"
import { client } from "@/api/client"
import { setTokens } from "@/lib/auth"

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return (error as { message: string }).message
  }
  return "An unexpected error occurred"
}

export function useLogin() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const { data: result, error } = await client.POST("/auth/login", {
        body: data,
      })
      if (error) throw error
      return result
    },
    onSuccess(data) {
      if (data) {
        setTokens({
          idToken: data.idToken,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
      }
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const { data: result, error } = await client.POST("/auth/register", {
        body: data,
      })
      if (error) throw error
      return result
    },
  })
}

export function useConfirm() {
  return useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      const { data: result, error } = await client.POST("/auth/confirm", {
        body: data,
      })
      if (error) throw error
      return result
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const { data: result, error } = await client.POST("/auth/forgot-password", {
        body: data,
      })
      if (error) throw error
      return result
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { email: string; code: string; newPassword: string }) => {
      const { data: result, error } = await client.POST("/auth/reset-password", {
        body: data,
      })
      if (error) throw error
      return result
    },
  })
}

export { extractErrorMessage }
