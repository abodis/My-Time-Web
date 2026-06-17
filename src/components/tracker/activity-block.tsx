import { type ResolvedColor } from '@/lib/color-utils'
import { formatElapsed } from '@/lib/time-utils'
import { cn } from '@/lib/utils'

export interface ActivityBlockProps {
  tagName: string
  color: ResolvedColor
  projectName: string
  activityName: string
  elapsed: number
  isRunning: boolean
  isLoading: boolean
  onClick: () => void
}

export function ActivityBlock({
  tagName,
  color,
  projectName,
  activityName,
  elapsed,
  isRunning,
  isLoading,
  onClick,
}: ActivityBlockProps) {
  const bg = isRunning ? color.dark : color.light
  const text = isRunning ? color.light : color.dark
  const badgeBg = isRunning ? color.light : color.dark
  const badgeText = isRunning ? color.dark : '#ffffff'

  return (
    <div className="relative w-full pb-[50%] tablet:w-[248px] tablet:h-[248px] tablet:pb-0">
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className={cn(
          'absolute inset-0 flex min-h-11 min-w-11 cursor-pointer flex-col items-start rounded-2xl p-4 font-block text-left transition-shadow tablet:p-6',
          'hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-70',
        )}
        style={{ backgroundColor: bg }}
      >
        {/* Tag badge */}
        <span
          className="rounded-lg px-3 py-1 text-xs font-bold leading-none"
          style={{ backgroundColor: badgeBg, color: badgeText }}
        >
          {tagName}
        </span>

        {/* Project name */}
        <span
          className="mt-3 w-full truncate text-xs font-bold tablet:text-sm"
          style={{ color: text, opacity: 0.75 }}
        >
          {projectName}
        </span>

        {/* Activity name — large, bold, responsive line-clamp */}
        <span
          className="mt-0.5 text-lg font-medium leading-tight line-clamp-1 tablet:text-2xl tablet:line-clamp-2"
          style={{ color: text }}
          title={activityName}
        >
          {activityName}
        </span>

        {/* Timer — large, bottom-left, sized to fit block width */}
        <span
          className="mt-auto font-timer text-4xl tabular-nums tablet:text-[58px] tablet:leading-none"
          style={{ color: text }}
        >
          {formatElapsed(elapsed)}
        </span>

        {/* Loading overlay */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/30" />
        )}
      </button>
    </div>
  )
}
