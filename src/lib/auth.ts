/**
 * Auth token store — stub for Task 3.
 * Full implementation in Task 4.
 */

let accessToken: string | null = null
let idToken: string | null = null

const REFRESH_TOKEN_KEY = "mtb_refresh_token"

export function getAccessToken(): string | null {
  return accessToken
}

export function getIdToken(): string | null {
  return idToken
}

export function setTokens(tokens: {
  idToken: string
  accessToken: string
  refreshToken: string
}): void {
  accessToken = tokens.accessToken
  idToken = tokens.idToken
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) return false

  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) return false

    const data = (await res.json()) as {
      idToken: string
      accessToken: string
    }
    accessToken = data.accessToken
    idToken = data.idToken
    return true
  } catch {
    return false
  }
}

export function clearAuth(): void {
  accessToken = null
  idToken = null
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function hasStoredSession(): boolean {
  return localStorage.getItem(REFRESH_TOKEN_KEY) !== null
}
