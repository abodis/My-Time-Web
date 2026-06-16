import { create } from 'zustand'

export interface AccountItem {
  id: string
  name: string
  role: string
  isOwner: boolean
}

interface AccountState {
  activeAccountId: string | null
  accounts: AccountItem[]
  setActiveAccount: (id: string) => void
  setAccounts: (accounts: AccountItem[]) => void
  clearAccountState: () => void
}

export const useAccountStore = create<AccountState>((set) => ({
  activeAccountId: null,
  accounts: [],

  setActiveAccount: (id) => {
    set({ activeAccountId: id })
    localStorage.setItem('lastAccountId', id)
  },

  setAccounts: (accounts) => {
    set({ accounts })
  },

  clearAccountState: () => {
    set({ activeAccountId: null, accounts: [] })
    localStorage.removeItem('lastAccountId')
  },
}))
