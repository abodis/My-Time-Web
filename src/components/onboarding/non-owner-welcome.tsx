import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { useNavigate } from "react-router-dom"
import { Clock3, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InlineConcept } from "@/components/onboarding/inline-concept"
import { useMe } from "@/hooks/use-me"
import { useCompleteLightOnboarding } from "@/hooks/use-onboarding"
import { paths } from "@/routes"

export const welcomeSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name").max(100),
  timezone: z.string().trim().min(1, "Select a timezone").max(100),
})

export type WelcomeFormData = z.infer<typeof welcomeSchema>

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again."
  }

  const err = error as Record<string, unknown>

  if (Array.isArray(err.detail) && err.detail.length > 0) {
    const first = err.detail[0] as { msg?: string }
    return first.msg ?? "Validation error. Please check your input."
  }

  if (typeof err.message === "string" && err.message.length > 0) {
    return err.message
  }

  return "Something went wrong. Please try again."
}

// Lightweight welcome for invited (non-owner) members: confirm profile, then
// hand off to the tracker. No currency, no workspace seeding (Req 9.3, 9.4).
export function NonOwnerWelcome() {
  const navigate = useNavigate()
  const { data: me } = useMe()
  const completeLightOnboarding = useCompleteLightOnboarding()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WelcomeFormData>({
    resolver: zodResolver(welcomeSchema),
    defaultValues: {
      displayName: me?.user.displayName ?? "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  })

  const onSubmit = async (data: WelcomeFormData) => {
    setApiError(null)
    try {
      await completeLightOnboarding.mutateAsync({
        displayName: data.displayName,
        timezone: data.timezone,
        avatar: null,
      })
      navigate(paths.tracker)
    } catch (err: unknown) {
      setApiError(getErrorMessage(err))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Welcome to My Time Blocks</h1>
        <p className="mt-1 text-sm text-text-muted">
          Confirm your details and you're ready to start tracking.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <InlineConcept
            icon={Clock3}
            title="Track your time in blocks"
            description="Start a timer on any activity assigned to you. Time is recorded as you work, no manual entry needed."
          />
          <InlineConcept
            icon={BarChart3}
            title="See it in reports"
            description="Everything you track rolls up into reports, so your effort is captured and visible."
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="welcome-display-name">Your name</Label>
            <Input id="welcome-display-name" placeholder="Your name" {...register("displayName")} />
            {errors.displayName && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.displayName.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="welcome-timezone">Timezone</Label>
            <Input id="welcome-timezone" {...register("timezone")} />
            {errors.timezone && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.timezone.message}</p>
            )}
          </div>

          {apiError && (
            <p className="rounded-md bg-[hsl(var(--destructive))]/10 px-3 py-2 text-xs text-[hsl(var(--destructive))]">
              {apiError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Setting up..." : "Start tracking"}
          </Button>
        </form>
      </div>
    </div>
  )
}
