import { Search } from "lucide-react"

interface SearchToolbarProps {
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  filterSlot?: React.ReactNode
  actionSlot?: React.ReactNode
}

export default function SearchToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filterSlot,
  actionSlot,
}: SearchToolbarProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-64 rounded-full border bg-white py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30"
        />
      </div>
      {filterSlot}
      {actionSlot && <div className="ml-auto">{actionSlot}</div>}
    </div>
  )
}

export type { SearchToolbarProps }
