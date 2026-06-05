import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { client } from "@/api/client"
import { setTokens } from "@/lib/auth"

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return (error as { message: string }).message
  }
  return "An unexpected error occurred"
}

export function useLogin() {
  const navigate = useNavigate()

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
      navigate("/")
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const { data: result, error } = await client.POST("/auth/register", {
        body: data,
      })
      if (error) throw error
      return result
    },
    onSuccess() {
      navigate("/confirm")
    },
  })
}

export function useConfirm() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      const { data: result, error } = await client.POST("/auth/confirm", {
        body: data,
      })
      if (error) throw error
      return result
    },
    onSuccess() {
      navigate("/login")
    },
  })
}

export function useForgotPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const { data: result, error } = await client.POST("/auth/forgot-password", {
        body: data,
      })
      if (error) throw error
      return result
    },
    onSuccess() {
      navigate("/reset-password")
    },
  })
}

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: { email: string; code: string; newPassword: string }) => {
      const { data: result, error } = await client.POST("/auth/reset-password", {
        body: data,
      })
      if (error) throw error
      return result
    },
    onSuccess() {
      navigate("/login")
    },
  })
}

export { extractErrorMessage }
