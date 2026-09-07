import { Navigate } from "react-router-dom"
import { useProfile } from "@/hooks/use-profile"
import { paths } from "@/routes"

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { data: profile, isLoading } = useProfile()

  // Fail-closed: render nothing while loading or profile unavailable
  if (isLoading || !profile) return null

  // Redirect unauthorized roles
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={paths.tracker} replace />
  }

  return <>{children}</>
}
