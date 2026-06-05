import { LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { clearAuth } from "@/lib/auth"
import { useProfile } from "@/hooks/use-profile"

export default function Topbar() {
  const navigate = useNavigate()
  const { data: profile } = useProfile()

  function handleLogout() {
    clearAuth()
    navigate("/login")
  }

  return (
    <header className="flex items-center justify-between border-b border-surface-border bg-surface px-4 py-3">
      {/* Mobile logo — visible only below md */}
      <div className="flex items-center gap-2 md:hidden">
        <img
          src="/myTimeBlocks-LOGO-50px.png"
          alt="My Time Blocks"
          className="h-7 w-7"
        />
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        {profile?.email && (
          <span className="text-sm text-text-muted">{profile.email}</span>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1" />
          Logout
        </Button>
      </div>
    </header>
  )
}
