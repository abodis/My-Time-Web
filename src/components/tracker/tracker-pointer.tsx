import { X } from "lucide-react"
import { useOnboardingStore } from "@/stores/onboarding-store"

interface TrackerPointerProps {
  className?: string
}

// First-run contextual hint rendered near an activity card after onboarding
// hand-off, prompting the new owner to start their first timer (Req 8.4, 8.6).
// Presentational + store-driven: visibility comes from the onboarding store's
// `showTrackerPointer`; dismissal is imperative via `dismissTrackerPointer`.
// Renders nothing when the pointer is not armed.
export function TrackerPointer({ className }: TrackerPointerProps) {
  const showTrackerPointer = useOnboardingStore((s) => s.showTrackerPointer)

  if (!showTrackerPointer) return null

  const handleDismiss = () => {
    useOnboardingStore.getState().dismissTrackerPointer()
  }

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl bg-brand/10 p-4 text-brand ${className ?? ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
          Start your first timer
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Tap an activity below to start tracking. The timer runs until you tap it
          again.
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss hint"
        className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-[hsl(var(--foreground))]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export type { TrackerPointerProps }
