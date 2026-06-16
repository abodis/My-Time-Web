import { useState, useEffect } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { hasStoredSession, refreshAccessToken, clearAuth } from "@/lib/auth"
import { useAccountStore } from "@/stores/account-store"

export default function ProtectedRoute() {
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">(
    hasStoredSession() ? "loading" : "unauthenticated"
  )
  const { pathname } = useLocation()
  const activeAccountId = useAccountStore((s) => s.activeAccountId)

  useEffect(() => {
    if (!hasStoredSession()) {
      setStatus("unauthenticated")
      return
    }

    refreshAccessToken().then((success) => {
      if (success) {
        setStatus("authenticated")
      } else {
        clearAuth()
        setStatus("unauthenticated")
      }
    })
  }, [])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">Loading...</p>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />
  }

  if (!activeAccountId && pathname !== "/select-account") {
    return <Navigate to="/select-account" replace />
  }

  return <Outlet />
}
