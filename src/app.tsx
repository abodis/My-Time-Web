import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { ErrorBoundary } from "@/components/error-boundary"
import { queryClient } from "@/lib/query-client"
import { router } from "@/routes"
import { usePalette } from "@/hooks/use-palette"

function PaletteGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isError, refetch } = usePalette()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-700">Unable to load color data</p>
        <button
          onClick={() => refetch()}
          className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <PaletteGate>
          <RouterProvider router={router} />
        </PaletteGate>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
