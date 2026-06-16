export interface SegmentedControlOption<T extends string> {
  label: string
  value: T
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex rounded-lg border border-[hsl(var(--border))] p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === option.value
              ? "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
              : "text-text-muted hover:text-[hsl(var(--foreground))]",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
