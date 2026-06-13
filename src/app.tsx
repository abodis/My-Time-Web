import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { ErrorBoundary } from "@/components/error-boundary"
import { queryClient } from "@/lib/query-client"
import { router } from "@/routes"

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
