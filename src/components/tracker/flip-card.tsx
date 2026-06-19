import { type ReactNode, useCallback } from 'react'

export interface FlipCardProps {
  isFlipped: boolean
  front: ReactNode
  back: ReactNode
  onFlipComplete?: () => void
}

export function FlipCard({ isFlipped, front, back, onFlipComplete }: FlipCardProps) {
  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName === 'transform') {
        onFlipComplete?.()
      }
    },
    [onFlipComplete],
  )

  return (
    <div style={{ perspective: '1000px' }} className="relative">
      <div
        onTransitionEnd={handleTransitionEnd}
        className="relative transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front face — relative to define container height */}
        <div
          className="relative"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>

        {/* Back face — absolute overlay */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
      </div>
    </div>
  )
}
