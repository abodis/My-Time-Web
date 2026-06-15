import { useMemo, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { useMembers } from "@/hooks/use-members"
import { useProfile } from "@/hooks/use-profile"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import SearchToolbar from "@/components/manage/search-toolbar"
import DataTable from "@/components/manage/data-table"
import type { Column } from "@/components/manage/data-table"
import InviteMemberDialog from "@/components/team/invite-member-dialog"
import EditMemberDialog from "@/components/team/edit-member-dialog"
import RemoveMemberDialog from "@/components/team/remove-member-dialog"
import type { components } from "@/api/schema"

type MemberResponse = components["schemas"]["MemberResponse"]

export default function TeamListPage() {
  const { data: members = [], isPending, isError } = useMembers()
  const { data: profile } = useProfile()

  const [search, setSearch] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editMember, setEditMember] = useState<MemberResponse | null>(null)
  const [removeMember, setRemoveMember] = useState<MemberResponse | null>(null)

  const isAdmin = profile?.role === "admin"

  const filtered = useMemo(() => {
    if (!search) return members
    const q = search.toLowerCase()
    return members.filter((m) => {
      const name = m.displayName ?? ""
      return name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    })
  }, [members, search])

  const columns = useMemo(() => {
    const cols: Column<MemberResponse>[] = [
      {
        key: "name",
        header: "Name",
        render: (m) => (
          <span className={`inline-flex items-center gap-1.5 ${m.joinedAt == null ? "text-[hsl(var(--muted-foreground))]" : ""}`}>
            {m.displayName ?? m.email}
            {profile && m.id === profile.id && (
              <span className="rounded-full bg-[hsl(var(--primary))]/10 px-2 py-0.5 text-xs font-medium text-[hsl(var(--primary))]">
                You
              </span>
            )}
            {m.joinedAt == null && (
              <span className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Pending
              </span>
            )}
          </span>
        ),
      },
      { key: "email", header: "Email" },
      {
        key: "role",
        header: "Role",
        render: (m) => <span className="capitalize">{m.role}</span>,
      },
    ]

    if (isAdmin) {
      cols.push(
        {
          key: "costRate",
          header: "Cost Rate",
          render: (m) => (m.costRate != null ? `$${m.costRate}` : "—"),
        },
        {
          key: "utilizationTarget",
          header: "Utilization %",
          render: (m) => (m.utilizationTarget != null ? `${m.utilizationTarget}%` : "—"),
        },
        {
          key: "weeklyCapacityHours",
          header: "Weekly Hrs",
          render: (m) => (m.weeklyCapacityHours != null ? `${m.weeklyCapacityHours}h` : "—"),
        },
        {
          key: "actions",
          header: "Actions",
          render: (m) => (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1 rounded hover:bg-gray-100"
                aria-label={`Edit ${m.displayName ?? m.email}`}
                onClick={() => setEditMember(m)}
              >
                <Pencil className="h-4 w-4" />
              </button>
              {profile && m.id !== profile.id && (
                <button
                  type="button"
                  className="p-1 rounded hover:bg-gray-100"
                  aria-label={`Remove ${m.displayName ?? m.email}`}
                  onClick={() => setRemoveMember(m)}
                >
                  <Trash2 className="h-4 w-4 text-[hsl(var(--destructive))]" />
                </button>
              )}
            </div>
          ),
        },
      )
    }

    return cols
  }, [isAdmin, profile])

  return (
    <div className="flex flex-col gap-6 p-6 wide:pt-0">
      <SearchToolbar
        searchPlaceholder="Search members by name or email"
        searchValue={search}
        onSearchChange={setSearch}
        actionSlot={
          isAdmin ? (
            <button
              type="button"
              className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:bg-[hsl(var(--primary))]/90"
              onClick={() => setInviteOpen(true)}
            >
              + Invite
            </button>
          ) : undefined
        }
      />

      <div className="rounded-2xl bg-white shadow-lg p-6">
        <h2 className="mb-4 text-lg font-semibold">Team Members</h2>
        {isPending ? (
          <LoadingSpinner />
        ) : isError ? (
          <p className="text-sm text-[hsl(var(--destructive))]">
            Failed to load team members.
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(m) => m.id}
            emptyMessage={search ? "No members found" : "No team members yet."}
          />
        )}
      </div>

      <InviteMemberDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <EditMemberDialog member={editMember} open={!!editMember} onClose={() => setEditMember(null)} />
      <RemoveMemberDialog member={removeMember} open={!!removeMember} onClose={() => setRemoveMember(null)} />
    </div>
  )
}
