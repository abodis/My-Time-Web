import { cn } from "@/lib/utils"

interface WizardStepperProps {
  steps: string[]
  currentIndex: number
}

export function WizardStepper({ steps, currentIndex }: WizardStepperProps) {
  return (
    <ol className="flex items-center gap-2" aria-label="Onboarding progress">
      {steps.map((label, index) => {
        const isActive = index === currentIndex
        const isComplete = index < currentIndex

        return (
          <li
            key={label}
            aria-current={isActive ? "step" : undefined}
            className="flex items-center gap-2"
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                isActive && "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
                isComplete && "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]",
                !isActive && !isComplete && "bg-surface-muted text-text-muted"
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "text-sm transition-colors",
                isActive ? "font-medium text-[hsl(var(--foreground))]" : "text-text-muted"
              )}
            >
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
