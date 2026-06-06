import type { ReactNode } from 'react'

export interface GridContainerProps {
  children: ReactNode
}

export function GridContainer({ children }: GridContainerProps): JSX.Element {
  return (
    <div
      className="mx-auto grid grid-cols-12 w-full gap-gutter-xs mobile:w-container-xs tablet:w-container-sm tablet:gap-gutter-sm desktop:w-container-md desktop:gap-gutter-md wide:w-container-lg wide:gap-gutter-lg ultrawide:w-container-xl ultrawide:gap-gutter-lg"
    >
      {children}
    </div>
  )
}
