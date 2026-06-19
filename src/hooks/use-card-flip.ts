import { useState, useCallback } from 'react'
import { useUpdateActivityColor } from '@/hooks/use-activity-colors'
import type { ColorToken } from '@/lib/color-utils'

export function useCardFlip(activityId: string) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [pendingColor, setPendingColor] = useState<ColorToken | null>(null)
  const updateColor = useUpdateActivityColor()

  const flip = useCallback(() => {
    if (isAnimating) return
    setIsFlipped(true)
    setIsAnimating(true)
  }, [isAnimating])

  const handleColorSelect = useCallback((token: ColorToken) => {
    setPendingColor(token)
    updateColor.mutate(
      { activityId, color: token },
      {
        onError: () => {
          setPendingColor(null)
        },
      }
    )
    // Auto-flip back after 100ms
    setTimeout(() => {
      setIsFlipped(false)
      setIsAnimating(true)
    }, 100)
  }, [activityId, updateColor])

  const handleFlipComplete = useCallback(() => {
    setIsAnimating(false)
    if (!isFlipped) {
      setPendingColor(null)
    }
  }, [isFlipped])

  const handleEscapeOrOutside = useCallback(() => {
    if (isFlipped && !isAnimating) {
      setIsFlipped(false)
      setIsAnimating(true)
    }
  }, [isFlipped, isAnimating])

  return {
    isFlipped,
    isAnimating,
    pendingColor,
    flip,
    handleColorSelect,
    handleFlipComplete,
    handleEscapeOrOutside,
    setIsAnimating,
  }
}
