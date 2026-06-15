import { useRef, type KeyboardEvent } from 'react'

export interface TabDefinition {
  id: string
  label: string
}

interface ProjectTabsProps {
  tabs: TabDefinition[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children: React.ReactNode
}

export function ProjectTabs({
  tabs,
  activeTab,
  onTabChange,
  children,
}: ProjectTabsProps): JSX.Element {
  const tablistRef = useRef<HTMLDivElement>(null)

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = tabs.findIndex((t) => t.id === document.activeElement?.id?.replace('tab-', ''))
    if (currentIndex === -1) return

    let nextIndex: number | null = null

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      nextIndex = (currentIndex + 1) % tabs.length
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onTabChange(tabs[currentIndex].id)
      return
    }

    if (nextIndex !== null) {
      const nextButton = tablistRef.current?.querySelector<HTMLButtonElement>(
        `#tab-${tabs[nextIndex].id}`
      )
      nextButton?.focus()
    }
  }

  return (
    <div>
      <div
        ref={tablistRef}
        role="tablist"
        onKeyDown={handleKeyDown}
        className="flex gap-1 mb-6"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={[
                'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand/10 text-brand'
                  : 'text-text-muted hover:bg-surface-muted',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {children}
      </div>
    </div>
  )
}
