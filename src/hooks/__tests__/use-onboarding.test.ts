import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"

vi.mock("@/api/client", () => ({
  client: {
    POST: vi.fn(),
  },
}))

import {
  useCompleteOnboarding,
  useCompleteLightOnboarding,
  useSeedExampleProject,
} from "../use-onboarding"
import { client } from "@/api/client"
import { queryKeys } from "@/api/query-keys"

function createHarness() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { wrapper, invalidateSpy }
}

function invalidatedKeys(spy: ReturnType<typeof vi.fn>) {
  return spy.mock.calls.map((call) => call[0]?.queryKey)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useCompleteOnboarding", () => {
  it("invalidates me, account and profile on success", async () => {
    vi.mocked(client.POST).mockResolvedValue({
      data: {},
      error: undefined,
      response: new Response(),
    })
    const { wrapper, invalidateSpy } = createHarness()

    const { result } = renderHook(() => useCompleteOnboarding(), { wrapper })
    result.current.mutate({
      displayName: "Alex",
      timezone: "UTC",
      currency: "USD",
    } as never)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = invalidatedKeys(invalidateSpy)
    expect(keys).toContainEqual(queryKeys.me.all())
    expect(keys).toContainEqual(queryKeys.account.all())
    expect(keys).toContainEqual(queryKeys.profile.all())
  })

  it("throws on failure and does not invalidate me", async () => {
    vi.mocked(client.POST).mockResolvedValue({
      data: undefined,
      error: { message: "boom" },
      response: new Response(),
    })
    const { wrapper, invalidateSpy } = createHarness()

    const { result } = renderHook(() => useCompleteOnboarding(), { wrapper })
    result.current.mutate({
      displayName: "Alex",
      timezone: "UTC",
      currency: "USD",
    } as never)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual({ message: "boom" })
    expect(invalidatedKeys(invalidateSpy)).not.toContainEqual(queryKeys.me.all())
  })
})

describe("useCompleteLightOnboarding", () => {
  it("invalidates me and profile on success", async () => {
    vi.mocked(client.POST).mockResolvedValue({
      data: {},
      error: undefined,
      response: new Response(),
    })
    const { wrapper, invalidateSpy } = createHarness()

    const { result } = renderHook(() => useCompleteLightOnboarding(), { wrapper })
    result.current.mutate({ displayName: "Sam", timezone: "UTC" } as never)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = invalidatedKeys(invalidateSpy)
    expect(keys).toContainEqual(queryKeys.me.all())
    expect(keys).toContainEqual(queryKeys.profile.all())
  })

  it("throws on failure and does not invalidate me", async () => {
    vi.mocked(client.POST).mockResolvedValue({
      data: undefined,
      error: { message: "boom" },
      response: new Response(),
    })
    const { wrapper, invalidateSpy } = createHarness()

    const { result } = renderHook(() => useCompleteLightOnboarding(), { wrapper })
    result.current.mutate({ displayName: "Sam", timezone: "UTC" } as never)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual({ message: "boom" })
    expect(invalidatedKeys(invalidateSpy)).not.toContainEqual(queryKeys.me.all())
  })
})

describe("useSeedExampleProject", () => {
  it("invalidates projects, tags and activities on success", async () => {
    vi.mocked(client.POST).mockResolvedValue({
      data: {},
      error: undefined,
      response: new Response(),
    })
    const { wrapper, invalidateSpy } = createHarness()

    const { result } = renderHook(() => useSeedExampleProject(), { wrapper })
    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = invalidatedKeys(invalidateSpy)
    expect(keys).toContainEqual(queryKeys.projects.all())
    expect(keys).toContainEqual(queryKeys.tags.all())
    expect(keys).toContainEqual(queryKeys.activities.all())
  })

  it("throws on failure and does not invalidate me", async () => {
    vi.mocked(client.POST).mockResolvedValue({
      data: undefined,
      error: { message: "boom" },
      response: new Response(),
    })
    const { wrapper, invalidateSpy } = createHarness()

    const { result } = renderHook(() => useSeedExampleProject(), { wrapper })
    result.current.mutate()

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual({ message: "boom" })
    expect(invalidatedKeys(invalidateSpy)).not.toContainEqual(queryKeys.me.all())
  })
})
