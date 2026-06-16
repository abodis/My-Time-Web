import createClient from "openapi-fetch"
import type { paths } from "./schema"
import {
  getAccessToken,
  refreshAccessToken,
  clearAuth,
} from "@/lib/auth"
import { queryClient } from "@/lib/query-client"
import { useAccountStore } from "@/stores/account-store"

const baseUrl = import.meta.env.VITE_API_BASE_URL

const client = createClient<paths>({ baseUrl })

// Stash a pristine clone of each request keyed by the request sent to the
// network. The body stream of the original is consumed by the first fetch, so
// to retry after a 401 refresh we must re-use a clone captured beforehand.
const pristineRequests = new WeakMap<Request, Request>()

// Deduplication guard: prevents concurrent account-error responses from
// triggering multiple redirects to /select-account.
let isHandlingAccountError = false

client.use({
  async onRequest({ request }) {
    const token = getAccessToken()
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`)
    }

    // Inject X-Account-Id for all requests except auth and account-listing endpoints.
    const url = new URL(request.url)
    const isAuthPath = url.pathname.startsWith("/auth/")
    const isAccountsList = url.pathname === "/accounts" && request.method === "GET"
    if (!isAuthPath && !isAccountsList) {
      const accountId = useAccountStore.getState().activeAccountId
      if (accountId) {
        request.headers.set("X-Account-Id", accountId)
      }
    }

    // Capture a clone before the body is consumed by the network call.
    pristineRequests.set(request, request.clone())
    return request
  },
  async onResponse({ response, request }) {
    if (response.status === 401) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        // Retry using the pristine clone (original body is already consumed).
        const pristine = pristineRequests.get(request)
        const retried = (pristine ?? request).clone()
        retried.headers.set("Authorization", `Bearer ${getAccessToken()}`)
        const accountId = useAccountStore.getState().activeAccountId
        if (accountId) {
          retried.headers.set("X-Account-Id", accountId)
        }
        return fetch(retried)
      }
      clearAuth()
      window.location.href = "/login"
    }
    // Account error interceptor
    if (response.status === 400 || response.status === 403) {
      try {
        const body = await response.clone().json()
        const accountErrors = ["missing_account_id", "invalid_account_id", "not_a_member"]
        if (body?.type && accountErrors.includes(body.type)) {
          if (!isHandlingAccountError) {
            isHandlingAccountError = true
            useAccountStore.getState().clearAccountState()
            queryClient.invalidateQueries()
            window.location.href = "/select-account"
          }
          return response
        }
      } catch {
        // Not JSON or parse error — not an account error, continue
      }
    }
    pristineRequests.delete(request)
    return response
  },
})

export { client }
