import { Navigate, Outlet } from "react-router-dom"
import { hasStoredSession } from "@/lib/auth"

export default function PublicOnlyRoute() {
  if (hasStoredSession()) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
