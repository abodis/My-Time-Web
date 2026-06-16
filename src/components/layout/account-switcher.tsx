import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAccountStore } from '@/stores/account-store'
import { queryClient } from '@/lib/query-client'

function truncateName(name: string, max = 24): string {
  if (name.length <= max) return name
  return name.slice(0, max) + '…'
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function AccountSwitcher(): JSX.Element | null {
  const accounts = useAccountStore((s) => s.accounts)
  const activeAccountId = useAccountStore((s) => s.activeAccountId)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  if (accounts.length < 2) return null

  const activeAccount = accounts.find((a) => a.id === activeAccountId)

  function handleSwitch(id: string) {
    useAccountStore.getState().setActiveAccount(id)
    queryClient.invalidateQueries()
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-sm text-text-muted hover:bg-surface-muted transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="shrink-0 text-xs">Account:</span>
        <span className="truncate font-medium">
          {activeAccount ? truncateName(activeAccount.name) : 'Select account'}
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl bg-white p-1 shadow-lg"
        >
          {accounts.map((account) => {
            const isActive = account.id === activeAccountId
            return (
              <button
                key={account.id}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSwitch(account.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${isActive
                  ? 'bg-surface-muted font-medium text-text'
                  : 'text-text-muted hover:bg-surface-muted'
                  }`}
              >
                <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                  <span className="truncate">{account.name}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {capitalize(account.role)}
                    </Badge>
                    {account.isOwner && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Owner
                      </Badge>
                    )}
                  </div>
                </div>
                {isActive && <Check className="h-4 w-4 shrink-0 text-brand" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
