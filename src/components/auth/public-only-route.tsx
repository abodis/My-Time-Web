import { Navigate, Outlet } from "react-router-dom"
import { hasStoredSession } from "@/lib/auth"
import { paths } from "@/routes"

export default function PublicOnlyRoute() {
  if (hasStoredSession()) {
    return <Navigate to={paths.tracker} replace />
  }

  return <Outlet />
}
