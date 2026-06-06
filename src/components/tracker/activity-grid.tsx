import type { ReactNode } from 'react'

export interface ActivityGridProps {
  children: ReactNode
}

export function ActivityGrid({ children }: ActivityGridProps) {
  return (
    <div className="grid grid-cols-1 gap-gutter-xs tablet:grid-cols-[repeat(auto-fill,248px)] tablet:justify-center tablet:gap-gutter-sm desktop:gap-gutter-md wide:gap-gutter-lg">
      {children}
    </div>
  )
}
