import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  setTokens,
  getAccessToken,
  getIdToken,
  clearAuth,
  hasStoredSession,
  refreshAccessToken,
} from "../auth"

describe("auth module", () => {
  beforeEach(() => {
    clearAuth()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe("setTokens / getAccessToken / getIdToken", () => {
    it("stores tokens and retrieves them", () => {
      setTokens({
        idToken: "id-123",
        accessToken: "access-456",
        refreshToken: "refresh-789",
      })

      expect(getAccessToken()).toBe("access-456")
      expect(getIdToken()).toBe("id-123")
      expect(localStorage.getItem("mtb_refresh_token")).toBe("refresh-789")
    })
  })

  describe("clearAuth", () => {
    it("removes all tokens", () => {
      setTokens({
        idToken: "id-123",
        accessToken: "access-456",
        refreshToken: "refresh-789",
      })

      clearAuth()

      expect(getAccessToken()).toBeNull()
      expect(getIdToken()).toBeNull()
      expect(localStorage.getItem("mtb_refresh_token")).toBeNull()
    })
  })

  describe("hasStoredSession", () => {
    it("returns false when no refresh token stored", () => {
      expect(hasStoredSession()).toBe(false)
    })

    it("returns true when refresh token exists in localStorage", () => {
      localStorage.setItem("mtb_refresh_token", "some-token")
      expect(hasStoredSession()).toBe(true)
    })
  })

  describe("refreshAccessToken", () => {
    it("returns false if no refresh token in localStorage", async () => {
      const result = await refreshAccessToken()
      expect(result).toBe(false)
    })

    it("on success, stores new tokens and returns true", async () => {
      localStorage.setItem("mtb_refresh_token", "valid-refresh-token")

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            idToken: "new-id-token",
            accessToken: "new-access-token",
          }),
        })
      )

      const result = await refreshAccessToken()

      expect(result).toBe(true)
      expect(getAccessToken()).toBe("new-access-token")
      expect(getIdToken()).toBe("new-id-token")
    })

    it("on failure (non-ok response), returns false", async () => {
      localStorage.setItem("mtb_refresh_token", "expired-token")

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
        })
      )

      const result = await refreshAccessToken()

      expect(result).toBe(false)
    })

    it("on network error, returns false", async () => {
      localStorage.setItem("mtb_refresh_token", "some-token")

      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network error"))
      )

      const result = await refreshAccessToken()

      expect(result).toBe(false)
    })
  })
})
