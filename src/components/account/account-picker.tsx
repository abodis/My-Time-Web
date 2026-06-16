import { AuthLayout } from "@/components/auth/auth-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface AccountItem {
  id: string
  name: string
  role: string
  isOwner: boolean
}

interface AccountPickerProps {
  accounts: AccountItem[]
  onSelect: (accountId: string) => void
}

export function AccountPicker({ accounts, onSelect }: AccountPickerProps) {
  return (
    <AuthLayout>
      <div className="space-y-3">
        <h2 className="text-center text-lg font-semibold">Select an Account</h2>
        {accounts.map((account) => (
          <Card
            key={account.id}
            className="cursor-pointer transition-colors hover:bg-[hsl(var(--accent))]"
            onClick={() => onSelect(account.id)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <span className="font-medium">{account.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{account.role.charAt(0).toUpperCase() + account.role.slice(1)}</Badge>
                {account.isOwner && <Badge variant="outline">Owner</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AuthLayout>
  )
}
