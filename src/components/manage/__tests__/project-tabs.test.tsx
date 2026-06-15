import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ProjectTabs, type TabDefinition } from '../project-tabs'

const TABS: TabDefinition[] = [
  { id: 'details', label: 'Project Details' },
  { id: 'budget', label: 'Budget' },
  { id: 'activities', label: 'Activities' },
]

describe('ProjectTabs', () => {
  it('renders tablist with correct roles', () => {
    render(
      <ProjectTabs tabs={TABS} activeTab="details" onTabChange={() => { }}>
        <div>Panel content</div>
      </ProjectTabs>
    )

    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })

  it('applies active styling and aria-selected to active tab', () => {
    render(
      <ProjectTabs tabs={TABS} activeTab="budget" onTabChange={() => { }}>
        <div>Panel</div>
      </ProjectTabs>
    )

    const budgetTab = screen.getByRole('tab', { name: 'Budget' })
    const detailsTab = screen.getByRole('tab', { name: 'Project Details' })

    expect(budgetTab).toHaveAttribute('aria-selected', 'true')
    expect(budgetTab).toHaveAttribute('tabindex', '0')
    expect(detailsTab).toHaveAttribute('aria-selected', 'false')
    expect(detailsTab).toHaveAttribute('tabindex', '-1')
  })

  it('sets aria-controls on tabs and aria-labelledby on panel', () => {
    render(
      <ProjectTabs tabs={TABS} activeTab="details" onTabChange={() => { }}>
        <div>Panel</div>
      </ProjectTabs>
    )

    const detailsTab = screen.getByRole('tab', { name: 'Project Details' })
    expect(detailsTab).toHaveAttribute('aria-controls', 'tabpanel-details')
    expect(detailsTab).toHaveAttribute('id', 'tab-details')

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('id', 'tabpanel-details')
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-details')
  })

  it('calls onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn()
    render(
      <ProjectTabs tabs={TABS} activeTab="details" onTabChange={onTabChange}>
        <div>Panel</div>
      </ProjectTabs>
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Budget' }))
    expect(onTabChange).toHaveBeenCalledWith('budget')
  })

  it('moves focus right with ArrowRight (wraps last to first)', () => {
    render(
      <ProjectTabs tabs={TABS} activeTab="activities" onTabChange={() => { }}>
        <div>Panel</div>
      </ProjectTabs>
    )

    const activitiesTab = screen.getByRole('tab', { name: 'Activities' })
    activitiesTab.focus()

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Project Details' }))
  })

  it('moves focus left with ArrowLeft (wraps first to last)', () => {
    render(
      <ProjectTabs tabs={TABS} activeTab="details" onTabChange={() => { }}>
        <div>Panel</div>
      </ProjectTabs>
    )

    const detailsTab = screen.getByRole('tab', { name: 'Project Details' })
    detailsTab.focus()

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Activities' }))
  })

  it('activates focused tab on Enter', () => {
    const onTabChange = vi.fn()
    render(
      <ProjectTabs tabs={TABS} activeTab="details" onTabChange={onTabChange}>
        <div>Panel</div>
      </ProjectTabs>
    )

    const budgetTab = screen.getByRole('tab', { name: 'Budget' })
    budgetTab.focus()

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Enter' })
    expect(onTabChange).toHaveBeenCalledWith('budget')
  })

  it('activates focused tab on Space', () => {
    const onTabChange = vi.fn()
    render(
      <ProjectTabs tabs={TABS} activeTab="details" onTabChange={onTabChange}>
        <div>Panel</div>
      </ProjectTabs>
    )

    const budgetTab = screen.getByRole('tab', { name: 'Budget' })
    budgetTab.focus()

    fireEvent.keyDown(screen.getByRole('tablist'), { key: ' ' })
    expect(onTabChange).toHaveBeenCalledWith('budget')
  })

  it('renders children inside tabpanel', () => {
    render(
      <ProjectTabs tabs={TABS} activeTab="details" onTabChange={() => { }}>
        <p>Form content here</p>
      </ProjectTabs>
    )

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Form content here')
  })
})
