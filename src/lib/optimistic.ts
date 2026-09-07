import type { QueryClient, QueryKey } from "@tanstack/react-query"

interface OptimisticContext<T> {
  previousData: T | undefined
  rollback: () => void
}

export async function listAppend<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  newItem: T,
): Promise<OptimisticContext<T[]>> {
  await queryClient.cancelQueries({ queryKey })
  const previousData = queryClient.getQueryData<T[]>(queryKey)
  queryClient.setQueryData<T[]>(queryKey, (old) => [...(old ?? []), newItem])
  return { previousData, rollback: () => queryClient.setQueryData(queryKey, previousData) }
}

export async function listRemove<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  predicate: (item: T) => boolean,
): Promise<OptimisticContext<T[]>> {
  await queryClient.cancelQueries({ queryKey })
  const previousData = queryClient.getQueryData<T[]>(queryKey)
  queryClient.setQueryData<T[]>(queryKey, (old) => (old ?? []).filter((item) => !predicate(item)))
  return { previousData, rollback: () => queryClient.setQueryData(queryKey, previousData) }
}

export async function listReorder<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  reorderFn: (items: T[]) => T[],
): Promise<OptimisticContext<T[]>> {
  await queryClient.cancelQueries({ queryKey })
  const previousData = queryClient.getQueryData<T[]>(queryKey)
  queryClient.setQueryData<T[]>(queryKey, (old) => reorderFn(old ?? []))
  return { previousData, rollback: () => queryClient.setQueryData(queryKey, previousData) }
}

export function applyReorder<T>(items: T[], reorderFn: (items: T[]) => T[]): T[] {
  return reorderFn(items)
}
