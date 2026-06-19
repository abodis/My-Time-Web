import { useState, useEffect, useRef, useCallback } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import { ActivityBlock } from '@/components/tracker/activity-block'
import { FlipCard } from '@/components/tracker/flip-card'
import { HoverOverlay } from '@/components/tracker/hover-overlay'
import { ColorPicker } from '@/components/tags/color-picker'
import { useCardFlip } from '@/hooks/use-card-flip'
import { useMarkActivityDone } from '@/hooks/use-mark-activity-done'
import { cn } from '@/lib/utils'
import type { ResolvedColor, ColorToken } from '@/lib/color-utils'
import type { components } from '@/api/schema'

type EnrichedActivityItem = components["schemas"]["EnrichedActivityItem"]

export interface SortableActivityCardProps {
  activity: EnrichedActivityItem
  color: ResolvedColor
  elapsed: number
  isRunning: boolean
  isLoading: boolean
  isDragActive: boolean
  index: number
  onTimerClick: (activityId: string) => void
}

export function SortableActivityCard({
  activity,
  color,
  elapsed,
  isRunning,
  isLoading,
  isDragActive,
  index,
  onTimerClick,
}: SortableActivityCardProps) {
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const markDone = useMarkActivityDone()

  const {
    isFlipped,
    isAnimating,
    pendingColor: _pendingColor,
    flip,
    handleColorSelect,
    handleFlipComplete,
    handleEscapeOrOutside,
  } = useCardFlip(activity.id)

  const { ref, handleRef } = useSortable({
    id: activity.id,
    index,
    disabled: isFlipped,
  })

  // Escape key handler
  useEffect(() => {
    if (!isFlipped) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleEscapeOrOutside()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isFlipped, handleEscapeOrOutside])

  // Outside click handler
  useEffect(() => {
    if (!isFlipped) return
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        handleEscapeOrOutside()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isFlipped, handleEscapeOrOutside])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleTimerClick = () => {
    if (isFlipped || isAnimating || isFadingOut || isLoading) return
    onTimerClick(activity.id)
  }

  const handleColorClick = () => {
    if (isFlipped || isAnimating) return
    flip()
  }

  const handleDoneClick = useCallback(() => {
    if (isFadingOut) return // double-click guard
    if (isRunning) {
      setToast("Stop the timer first")
      return
    }
    setIsFadingOut(true)
    markDone.mutate(
      { id: activity.id, isDone: true },
      {
        onError: (err) => {
          setIsFadingOut(false)
          const code = (err as { code?: string })?.code
          if (code === "timer_running") {
            setToast("Stop the timer first")
          } else {
            setToast("Failed to mark as done")
          }
        },
      }
    )
  }, [isFadingOut, isRunning, activity.id, markDone])

  const frontFace = (
    <div className={cn("relative group h-full transition-all duration-300", isFadingOut && "opacity-0 scale-95")}>
      <ActivityBlock
        tagName={activity.tagName ?? 'Unknown'}
        color={color}
        projectName={activity.projectName}
        activityName={activity.name}
        elapsed={elapsed}
        isRunning={isRunning}
        isLoading={isLoading}
        onClick={handleTimerClick}
      />
      <HoverOverlay
        onDoneClick={handleDoneClick}
        onColorClick={handleColorClick}
        isDragActive={isDragActive}
        isTimerRunning={isRunning}
        isRunning={isRunning}
        dragHandleRef={handleRef}
        colorDark={color.dark}
        colorLight={color.light}
      />
    </div>
  )

  const backFace = (
    <div
      className="flex h-full w-full items-center justify-center rounded-2xl p-4"
      style={{ backgroundColor: color.light }}
    >
      <ColorPicker
        value={activity.tagColor as ColorToken | null}
        onChange={handleColorSelect}
      />
    </div>
  )

  return (
    <div
      ref={(node) => {
        ref(node)
          ; (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      }}
      data-activity-id={activity.id}
      className={cn(isDragActive && 'pointer-events-auto [&_button]:hover:shadow-none')}
    >
      <FlipCard
        isFlipped={isFlipped}
        front={frontFace}
        back={backFace}
        onFlipComplete={handleFlipComplete}
      />
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-gray-800 px-4 py-3 text-sm text-white shadow-lg animate-[fadeIn_0.2s_ease-out]">
          {toast}
        </div>
      )}
    </div>
  )
}
