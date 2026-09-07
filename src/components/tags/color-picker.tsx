import { Check } from "lucide-react"
import { usePalette } from "@/hooks/use-palette"
import { SELECTABLE_COLORS, type ColorToken } from "@/lib/color-utils"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: ColorToken | null
  onChange: (token: ColorToken) => void
  disabled?: boolean
  /** When set, lays swatches out in a centered grid of N columns instead of flex-wrap. */
  columns?: number
  className?: string
}

export function ColorPicker({ value, onChange, disabled, columns, className }: ColorPickerProps) {
  const { data: palette, isLoading } = usePalette()

  const isDisabled = disabled || isLoading || !palette

  const containerClass = columns
    ? "grid justify-items-center gap-2"
    : "flex flex-wrap gap-2"

  return (
    <div
      className={cn(containerClass, className)}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, max-content))` } : undefined}
      role="radiogroup"
      aria-label="Tag color"
    >
      {SELECTABLE_COLORS.map((token) => {
        const isSelected = value === token
        const backgroundColor = palette?.[token]?.normal ?? undefined

        return (
          <button
            key={token}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={token}
            disabled={isDisabled}
            onClick={() => onChange(token)}
            className="relative h-8 w-8 cursor-pointer rounded-full border-2 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor,
              borderColor: isSelected ? "currentColor" : "transparent",
            }}
          >
            {isSelected && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Check className="h-4 w-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
