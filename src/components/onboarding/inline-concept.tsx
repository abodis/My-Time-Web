import type { LucideIcon } from "lucide-react"

interface InlineConceptProps {
  title: string
  description: string
  icon?: LucideIcon
}

// Small presentational explainer card used within the onboarding flow to teach
// a concept inline before the user acts (guided chain steps + non-owner welcome).
export function InlineConcept({ title, description, icon: Icon }: InlineConceptProps) {
  return (
    <div className="flex gap-3 rounded-xl bg-surface-muted p-4">
      {Icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</p>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
    </div>
  )
}

export type { InlineConceptProps }
