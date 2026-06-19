import { Check, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HoverOverlayProps {
  onDoneClick: () => void
  onColorClick: () => void
  isDragActive: boolean
  isTimerRunning: boolean
  isRunning: boolean
  dragHandleRef?: (element: Element | null) => void
  colorDark: string
  colorLight: string
}

export function HoverOverlay({
  onDoneClick,
  onColorClick,
  isDragActive,
  isTimerRunning,
  isRunning,
  dragHandleRef,
  colorDark,
  colorLight,
}: HoverOverlayProps) {
  // Drag strip colors: dark bg + light dots (reversed when running)
  const stripBg = isRunning ? colorLight : colorDark
  const dotColor = isRunning ? colorDark : colorLight

  return (
    <>
      {/* Drag handle — full left side strip */}
      <div
        ref={dragHandleRef}
        className={cn(
          'absolute top-0 left-0 bottom-0 z-10 w-[19px] rounded-l-2xl',
          'opacity-0 group-hover:opacity-60 transition-opacity duration-200',
          'pointer-coarse:opacity-60',
          'touch-none cursor-grab active:cursor-grabbing',
          'flex items-center justify-center',
          isDragActive && 'opacity-0 pointer-events-none',
        )}
        style={{ backgroundColor: stripBg }}
        aria-label="Drag to reorder"
      >
        {/* 2x3 dot grid pattern repeated vertically */}
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex gap-1">
              <div className="h-1 w-1 rounded-full" style={{ backgroundColor: dotColor }} />
              <div className="h-1 w-1 rounded-full" style={{ backgroundColor: dotColor }} />
            </div>
          ))}
        </div>
      </div>

      {/* Action icons — top-right, half size */}
      <div
        className={cn(
          'absolute top-3.5 right-4 z-10 flex gap-1 tablet:top-[22px] tablet:right-6',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'pointer-coarse:opacity-100',
          isDragActive && 'opacity-0 pointer-events-none',
        )}
      >
        <button
          type="button"
          aria-label="Mark as done"
          disabled={isTimerRunning}
          onClick={(e) => {
            e.stopPropagation()
            onDoneClick()
          }}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full',
            'bg-white/80 backdrop-blur-sm shadow-sm',
            'hover:bg-white transition-colors',
            isTimerRunning && 'opacity-40 pointer-events-none',
          )}
        >
          <Check className="h-3 w-3 text-gray-700" />
        </button>

        <button
          type="button"
          aria-label="Change color"
          onClick={(e) => {
            e.stopPropagation()
            onColorClick()
          }}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full',
            'bg-white/80 backdrop-blur-sm shadow-sm',
            'hover:bg-white transition-colors',
          )}
        >
          <Palette className="h-3 w-3 text-gray-700" />
        </button>
      </div>
    </>
  )
}
