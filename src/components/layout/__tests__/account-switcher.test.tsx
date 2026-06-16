import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { AccountSwitcher } from '../account-switcher'
import { useAccountStore } from '@/stores/account-store'
import { queryClient } from '@/lib/query-client'

vi.mock('@/lib/query-client', () => ({
  queryClient: { invalidateQueries: vi.fn() },
}))

const twoAccounts = [
  { id: 'acc-1', name: 'Acme Corp', role: 'admin', isOwner: true },
  { id: 'acc-2', name: 'Freelance Work', role: 'user', isOwner: false },
]

beforeEach(() => {
  useAccountStore.setState({
    activeAccountId: 'acc-1',
    accounts: twoAccounts,
  })
  vi.clearAllMocks()
})

describe('AccountSwitcher', () => {
  it('renders nothing when accounts < 2', () => {
    useAccountStore.setState({ accounts: [twoAccounts[0]] })
    const { container } = render(<AccountSwitcher />)
    expect(container.innerHTML).toBe('')
  })

  it('renders when accounts >= 2', () => {
    render(<AccountSwitcher />)
    expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument()
  })

  it('displays active account name', () => {
    render(<AccountSwitcher />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('truncates long account name to 24 chars with ellipsis', () => {
    useAccountStore.setState({
      accounts: [
        { id: 'acc-1', name: 'A Very Long Account Name That Exceeds Limit', role: 'admin', isOwner: false },
        { id: 'acc-2', name: 'Short', role: 'user', isOwner: false },
      ],
      activeAccountId: 'acc-1',
    })
    render(<AccountSwitcher />)
    expect(screen.getByText('A Very Long Account Name…')).toBeInTheDocument()
  })

  it('opens dropdown on click and shows all accounts', () => {
    render(<AccountSwitcher />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    // "Acme Corp" appears in both trigger and dropdown
    expect(screen.getAllByText('Acme Corp')).toHaveLength(2)
    expect(screen.getByText('Freelance Work')).toBeInTheDocument()
  })

  it('shows role badges in dropdown', () => {
    render(<AccountSwitcher />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))

    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('shows Owner badge only for owner accounts', () => {
    render(<AccountSwitcher />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))

    const ownerBadges = screen.getAllByText('Owner')
    expect(ownerBadges).toHaveLength(1)
  })

  it('visually distinguishes active account with check mark', () => {
    render(<AccountSwitcher />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))

    const activeOption = screen.getByRole('option', { selected: true })
    expect(activeOption).toBeInTheDocument()
  })

  it('switches account, invalidates queries, and closes dropdown', () => {
    render(<AccountSwitcher />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    fireEvent.click(screen.getByText('Freelance Work'))

    expect(useAccountStore.getState().activeAccountId).toBe('acc-2')
    expect(queryClient.invalidateQueries).toHaveBeenCalled()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes dropdown on outside click', () => {
    render(
      <div>
        <AccountSwitcher />
        <div data-testid="outside">outside</div>
      </div>
    )
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
