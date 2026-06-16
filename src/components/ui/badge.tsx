import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" &&
        "border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
        variant === "secondary" &&
        "border-transparent bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]",
        variant === "outline" && "text-[hsl(var(--foreground))]",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
export type { BadgeProps }
