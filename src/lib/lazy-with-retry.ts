import { lazy } from "react"

export function lazyWithRetry<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await factory()
      } catch (error) {
        if (attempt === retries) throw error
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
    throw new Error("Failed to load module") // unreachable but satisfies TS
  })
}
