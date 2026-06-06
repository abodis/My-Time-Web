import createClient from "openapi-fetch"
import type { paths } from "./schema"
import {
  getAccessToken,
  refreshAccessToken,
  clearAuth,
} from "@/lib/auth"

const baseUrl = import.meta.env.VITE_API_BASE_URL

const client = createClient<paths>({ baseUrl })

// Stash a pristine clone of each request keyed by the request sent to the
// network. The body stream of the original is consumed by the first fetch, so
// to retry after a 401 refresh we must re-use a clone captured beforehand.
const pristineRequests = new WeakMap<Request, Request>()

client.use({
  async onRequest({ request }) {
    const token = getAccessToken()
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`)
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
        return fetch(retried)
      }
      clearAuth()
      window.location.href = "/login"
    }
    pristineRequests.delete(request)
    return response
  },
})

export { client }
