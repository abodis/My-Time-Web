import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency"
import { useCompleteOnboarding } from "@/hooks/use-onboarding"
import type { components } from "@/api/schema"

type MeResponse = components["schemas"]["MeResponse"]

// Currency enum sourced from SUPPORTED_CURRENCIES (GBP, EUR, USD, PLN).
const CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code) as [
  CurrencyCode,
  ...CurrencyCode[],
]

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter your name")
    .max(100, "Name must be 100 characters or less"),
  timezone: z
    .string()
    .trim()
    .min(1, "Select a timezone")
    .max(100, "Timezone must be 100 characters or less"),
  currency: z.enum(CURRENCY_CODES),
})

export type ProfileFormData = z.infer<typeof profileSchema>

export interface ProfileStepProps {
  /** Aggregate identity used to pre-fill displayName. */
  me: MeResponse
  /** Called after POST /onboarding succeeds, so the wizard advances. */
  onCompleted: () => void
}

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again."
  }

  const err = error as Record<string, unknown>

  // 400 currency-validation error
  if (err.type === "validation" || err.type === "bad_request") {
    if (typeof err.message === "string" && err.message.length > 0) return err.message
    return "That currency isn't supported. Pick one from the list."
  }

  // 404 — no owned account for this user
  if (err.type === "not_found") {
    return "We couldn't find an account you own. Please try again."
  }

  // 422 — HTTPValidationError with detail array
  if (Array.isArray(err.detail) && err.detail.length > 0) {
    const first = err.detail[0] as { msg?: string }
    return first.msg ?? "Validation error. Please check your input."
  }

  if (typeof err.message === "string" && err.message.length > 0) {
    return err.message
  }

  return "Something went wrong. Please try again."
}

export function ProfileStep({ me, onCompleted }: ProfileStepProps) {
  const completeOnboarding = useCompleteOnboarding()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: me.user.displayName ?? "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currency: SUPPORTED_CURRENCIES[0].code,
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setApiError(null)
    try {
      // avatar omitted from the request (out of scope) — sent as null.
      await completeOnboarding.mutateAsync({
        displayName: data.displayName,
        timezone: data.timezone,
        currency: data.currency,
        avatar: null,
      })
      onCompleted()
    } catch (err: unknown) {
      setApiError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-display-name">Your name</Label>
        <Input
          id="profile-display-name"
          type="text"
          placeholder="Alex Doe"
          {...register("displayName")}
        />
        {errors.displayName && (
          <p className="text-xs text-[hsl(var(--destructive))]">{errors.displayName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-timezone">Timezone</Label>
        <Input
          id="profile-timezone"
          type="text"
          placeholder="Europe/Madrid"
          {...register("timezone")}
        />
        {errors.timezone && (
          <p className="text-xs text-[hsl(var(--destructive))]">{errors.timezone.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-currency">Account currency</Label>
        <select
          id="profile-currency"
          {...register("currency")}
          className="flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.name}
            </option>
          ))}
        </select>
        {errors.currency && (
          <p className="text-xs text-[hsl(var(--destructive))]">{errors.currency.message}</p>
        )}
      </div>

      {apiError && (
        <p className="text-xs text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 rounded-md px-3 py-2">
          {apiError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Continue"}
      </Button>
    </form>
  )
}
