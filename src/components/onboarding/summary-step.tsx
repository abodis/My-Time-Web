import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, Tag, FolderKanban, Activity } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { paths } from "@/routes"

// A single recap row: an icon + label + the recorded name.
interface RecapItem {
  icon: typeof Tag
  label: string
  name: string
}

// Final wizard step. Recaps what the owner set up this session (created tag /
// project / activity from `createdSummary`, or the seeded example) and hands
// off to the tracker. Finishing arms the Tracker_Pointer (so the tracker shows
// the first-timer hint) then navigates to the tracker.
//
// Completion (`POST /onboarding`) already happened at the Profile step via
// useCompleteOnboarding — this step never re-completes. It does NOT reset the
// onboarding store: `showTrackerPointer` is session-scoped (not persisted) and
// the tracker must still read it after navigation; a reset here would clear it
// before the pointer renders. On next sign-in the flow re-derives from `/me`.
export function SummaryStep() {
  const navigate = useNavigate()
  const createdSummary = useOnboardingStore((s) => s.createdSummary)
  const seededExample = useOnboardingStore((s) => s.seededExample)
  const [navError, setNavError] = useState<string | null>(null)

  const items: RecapItem[] = []
  if (createdSummary.tag) {
    items.push({ icon: Tag, label: "Tag", name: createdSummary.tag })
  }
  if (createdSummary.project) {
    items.push({ icon: FolderKanban, label: "Project", name: createdSummary.project })
  }
  if (createdSummary.activity) {
    items.push({ icon: Activity, label: "Activity", name: createdSummary.activity })
  }

  const handleFinish = () => {
    setNavError(null)
    try {
      // Arm the pointer BEFORE navigating so the tracker sees it on first render.
      useOnboardingStore.getState().armTrackerPointer()
      navigate(paths.tracker)
    } catch {
      // Navigation failure keeps the owner here with a retry (Req 8.5).
      setNavError("Couldn't open the tracker. Please try again.")
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-6 w-6 text-[hsl(var(--primary))]" />
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
          You're all set
        </h2>
      </div>
      <p className="mt-1 text-sm text-text-muted">
        Here's what you set up. Next, start a timer on the tracker to log your
        first block.
      </p>

      {items.length > 0 && (
        <ul className="mt-6 flex flex-col gap-2">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <li
                key={item.label}
                className="flex items-center gap-3 rounded-xl bg-surface-muted p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-muted">{item.label}</p>
                  <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                    {item.name}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {items.length === 0 && seededExample && (
        <div className="mt-6 flex items-center gap-3 rounded-xl bg-surface-muted p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <FolderKanban className="h-4 w-4" />
          </div>
          <p className="text-sm text-[hsl(var(--foreground))]">
            An example project with sample activities is ready on your tracker.
          </p>
        </div>
      )}

      {navError && (
        <p className="mt-4 rounded-md bg-[hsl(var(--destructive))]/10 px-3 py-2 text-xs text-[hsl(var(--destructive))]">
          {navError}
        </p>
      )}

      <div className="mt-6">
        <Button type="button" className="w-full" onClick={handleFinish}>
          Go to tracker
        </Button>
      </div>
    </div>
  )
}
