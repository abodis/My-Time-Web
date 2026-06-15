import { Navigate } from "react-router-dom"
import { useProfile } from "@/hooks/use-profile"

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
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
