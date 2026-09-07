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

// The API base URL may include a path prefix (e.g. "/api" in dev via the Vite
// proxy), so request pathnames look like "/api/auth/login". Match on the API
// route segments regardless of that prefix.
function isAuthPath(pathname: string): boolean {
  return /(^|\/)auth\//.test(pathname)
}

// Endpoints that are not scoped to an account: they must not receive an
// X-Account-Id header and must not trigger the account-error redirect. These
// run before/without an active account (auth, account listing, palette).
function isAccountAgnosticPath(pathname: string, method: string): boolean {
  if (isAuthPath(pathname)) return true
  if (/(^|\/)accounts$/.test(pathname) && method === "GET") return true
  if (/(^|\/)palette$/.test(pathname)) return true
  return false
}

client.use({
  async onRequest({ request }) {
    const token = getAccessToken()
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`)
    }

    // Inject X-Account-Id for all requests except account-agnostic endpoints
    // (auth, account listing, and the global color palette).
    const url = new URL(request.url)
    if (!isAccountAgnosticPath(url.pathname, request.method)) {
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
    // A 401 from an auth endpoint (e.g. bad login credentials) is not an expired
    // session — let it pass through so the caller can surface the error. The
    // refresh-then-logout path below is only for authenticated endpoints.
    const isAuthEndpoint = isAuthPath(new URL(request.url).pathname)
    if (response.status === 401 && !isAuthEndpoint) {
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
    // Account error interceptor — skip for account-agnostic paths (e.g. /palette,
    // which is mounted globally above the router and runs before an account is
    // selected). Redirecting on those would kick the user off the login page.
    const url = new URL(request.url)
    if (
      !isAccountAgnosticPath(url.pathname, request.method) &&
      (response.status === 400 || response.status === 403)
    ) {
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

// Envelope unwrap middleware — extracts `{ data: X }` responses so callers
// receive the inner payload directly.
client.use({
  async onResponse({ response }) {
    if (!response.ok) return response
    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) return response

    const body = await response.clone().json()

    if (body && typeof body === "object" && "data" in body && Object.keys(body).length <= 2) {
      return new Response(JSON.stringify(body.data), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    }

    return response
  },
})

export { client }
