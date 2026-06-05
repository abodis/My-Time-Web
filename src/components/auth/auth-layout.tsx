import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <img
            src="/myTimeBlocks-LOGO-50px.png"
            alt="My Time Blocks"
            className="h-[50px]"
          />
        </div>
        <Card>
          <CardContent className="p-6">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
