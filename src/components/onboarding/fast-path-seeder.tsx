import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Loader2, Rocket } from "lucide-react"

import { Button } from "@/components/ui/button"
import { isSeedConflict, useSeedExampleProject } from "@/hooks/use-onboarding"
import { useOnboardingStore } from "@/stores/onboarding-store"

type SeedStatus = "loading" | "success" | "error"

function getErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "Seeding took too long. Please try again."
  }
  if (!error || typeof error !== "object") {
    return "We couldn't set up your example project. Please try again."
  }
  const err = error as Record<string, unknown>
  if (typeof err.message === "string" && err.message.length > 0) return err.message
  return "We couldn't set up your example project. Please try again."
}

// Fast-path step: seeds the example project (POST /onboarding/example-project),
// records the seed in the onboarding store, then advances to the invite step.
// A 409 (already seeded) is treated as success (idempotent-guarded — a second
// call conflicts; design.md Req 5.2/5.3). Other failures show a retryable error.
export function FastPathSeeder() {
  const seedExampleProject = useSeedExampleProject()
  const [status, setStatus] = useState<SeedStatus>("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Guard so the effect fires the seed exactly once (React StrictMode double-invoke).
  const startedRef = useRef(false)

  const runSeed = async () => {
    setStatus("loading")
    setErrorMessage(null)
    try {
      await seedExampleProject.mutateAsync()
      // 201 created — mark seeded and advance.
      useOnboardingStore.getState().markSeeded()
      setStatus("success")
      useOnboardingStore.getState().goTo("invite")
    } catch (err: unknown) {
      // 409 — already seeded this account. Treat as success: no error shown.
      if (isSeedConflict(err)) {
        useOnboardingStore.getState().markSeeded()
        setStatus("success")
        useOnboardingStore.getState().goTo("invite")
        return
      }
      setErrorMessage(getErrorMessage(err))
      setStatus("error")
    }
  }

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    // Fire once on mount; runSeed reads/writes fresh state imperatively.
    void runSeed()
  }, [])

  return (
    <div className="text-center">
      <div className="flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Rocket className="h-6 w-6" />
        </div>
      </div>

      <h2 className="mt-4 text-xl font-semibold text-[hsl(var(--foreground))]">
        Setting up your example project
      </h2>

      {status === "loading" && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" aria-hidden="true" />
          <p className="text-sm text-text-muted" role="status">
            Seeding a sample project, tag, and activity so your tracker is never empty…
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <CheckCircle2
            className="h-5 w-5 text-[hsl(var(--primary))]"
            aria-hidden="true"
          />
          <p className="text-sm text-text-muted" role="status">
            Your example project is ready.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 flex flex-col items-center gap-4">
          <p
            role="alert"
            className="rounded-md bg-[hsl(var(--destructive))]/10 px-3 py-2 text-sm text-[hsl(var(--destructive))]"
          >
            {errorMessage}
          </p>
          <Button
            type="button"
            onClick={() => void runSeed()}
            disabled={seedExampleProject.isPending}
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}
