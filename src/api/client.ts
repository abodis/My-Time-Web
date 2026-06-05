import createClient from "openapi-fetch"
import type { paths } from "./schema"
import {
  getAccessToken,
  refreshAccessToken,
  clearAuth,
} from "@/lib/auth"

const baseUrl = import.meta.env.VITE_API_BASE_URL

const client = createClient<paths>({ baseUrl })

client.use({
  async onRequest({ request }) {
    const token = getAccessToken()
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`)
    }
    return request
  },
  async onResponse({ response, request }) {
    if (response.status === 401) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        request.headers.set("Authorization", `Bearer ${getAccessToken()}`)
        return fetch(request)
      }
      clearAuth()
      window.location.href = "/login"
    }
    return response
  },
})

export { client }
