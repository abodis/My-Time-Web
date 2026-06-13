import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { readFileSync } from "fs"
import { resolve } from "path"

vi.mock("@/api/client", () => ({
  client: {
    POST: vi.fn(),
  },
}))

vi.mock("@/lib/auth", () => ({
  setTokens: vi.fn(),
}))

import { useLogin } from "../use-auth"
import { client } from "@/api/client"
import { setTokens } from "@/lib/auth"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls setTokens on successful login and returns mutation data", async () => {
    const mockResponse = {
      idToken: "id-abc",
      accessToken: "access-xyz",
      refreshToken: "refresh-123",
    }
    vi.mocked(client.POST).mockResolvedValue({
      data: mockResponse,
      error: undefined,
      response: new Response(),
    })

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

    result.current.mutate({ email: "test@example.com", password: "pass123" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(setTokens).toHaveBeenCalledWith({
      idToken: "id-abc",
      accessToken: "access-xyz",
      refreshToken: "refresh-123",
    })
    expect(result.current.data).toEqual(mockResponse)
  })

  it("does not import react-router-dom (no navigation within hook)", () => {
    const sourceFile = resolve(__dirname, "../use-auth.ts")
    const source = readFileSync(sourceFile, "utf-8")
    expect(source).not.toContain("react-router-dom")
    expect(source).not.toContain("useNavigate")
  })
})
