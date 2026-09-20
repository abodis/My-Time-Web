import { useState } from "react"
import { Rocket, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useOnboardingStore, type ChosenPath } from "@/stores/onboarding-store"

interface WorkspacePathStepProps {
  onNext: () => void
}

interface PathOption {
  value: Exclude<ChosenPath, null>
  name: string
  outcome: string
  icon: typeof Rocket
}

const PATH_OPTIONS: PathOption[] = [
  {
    value: "fast",
    name: "Fast path",
    outcome: "Seed an example project so your tracker and reports are never empty.",
    icon: Rocket,
  },
  {
    value: "guided",
    name: "Guided path",
    outcome: "Create your first real tag, project, and activity with step-by-step help.",
    icon: Wrench,
  },
]

// Owner wizard step where the owner picks how to populate their workspace.
// Exactly one path must be selected before advancing; the choice is written to
// the onboarding store so downstream steps (fast seeder / guided chain) branch on it.
export function WorkspacePathStep({ onNext }: WorkspacePathStepProps) {
  const chosenPath = useOnboardingStore((s) => s.chosenPath)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = (value: Exclude<ChosenPath, null>) => {
    useOnboardingStore.getState().choosePath(value)
    setError(null)
  }

  const handleAdvance = () => {
    if (!chosenPath) {
      setError("Select one path to continue.")
      return
    }
    onNext()
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
        Set up your workspace
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        Choose how to get started. You can explore the other option later.
      </p>

      <div
        role="radiogroup"
        aria-label="Workspace setup path"
        className="mt-6 grid gap-4 sm:grid-cols-2"
      >
        {PATH_OPTIONS.map(({ value, name, outcome, icon: Icon }) => {
          const isSelected = chosenPath === value

          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(value)}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border p-5 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]",
                isSelected
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                  : "border-[hsl(var(--input))] bg-white hover:bg-surface-muted"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  isSelected
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "bg-brand/10 text-brand"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{name}</p>
                <p className="mt-1 text-sm text-text-muted">{outcome}</p>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-[hsl(var(--destructive))]">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <Button type="button" onClick={handleAdvance} disabled={!chosenPath}>
          Continue
        </Button>
      </div>
    </div>
  )
}

export type { WorkspacePathStepProps }
