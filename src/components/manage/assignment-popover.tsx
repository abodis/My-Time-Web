import { useMemo, useState } from "react"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { useMembers } from "@/hooks/use-members"
import {
  useAssignments,
  useAssignActivity,
  useUnassignActivity,
} from "@/hooks/use-assignments"
import type { components } from "@/api/schema"

type MemberResponse = components["schemas"]["MemberResponse"]

interface AssignmentPopoverProps {
  activityId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignmentPopover({
  activityId,
  open,
  onOpenChange,
}: AssignmentPopoverProps) {
  const [search, setSearch] = useState("")

  const { data: members, isError: membersError } = useMembers()
  const { data: assignments } = useAssignments(activityId)
  const assignMutation = useAssignActivity(activityId)
  const unassignMutation = useUnassignActivity(activityId)

  const assignedUserIds = useMemo(() => {
    const set = new Set<string>()
    if (assignments) {
      for (const a of assignments) {
        set.add(a.userId)
      }
    }
    return set
  }, [assignments])

  const sortedMembers = useMemo(() => {
    if (!members) return []
    return [...members].sort((a, b) => {
      const nameA = (a.displayName ?? a.email).toLowerCase()
      const nameB = (b.displayName ?? b.email).toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }, [members])

  const filteredMembers = useMemo(() => {
    if (!search) return sortedMembers
    const term = search.toLowerCase()
    return sortedMembers.filter((m) => {
      const name = (m.displayName ?? "").toLowerCase()
      const email = m.email.toLowerCase()
      return name.includes(term) || email.includes(term)
    })
  }, [sortedMembers, search])

  const inFlightUserIds = useMemo(() => {
    const set = new Set<string>()
    if (assignMutation.isPending && assignMutation.variables) {
      set.add(assignMutation.variables)
    }
    if (unassignMutation.isPending && unassignMutation.variables) {
      set.add(unassignMutation.variables)
    }
    return set
  }, [
    assignMutation.isPending,
    assignMutation.variables,
    unassignMutation.isPending,
    unassignMutation.variables,
  ])

  function handleToggle(member: MemberResponse) {
    if (inFlightUserIds.has(member.id)) return
    if (assignedUserIds.has(member.id)) {
      unassignMutation.mutate(member.id)
    } else {
      assignMutation.mutate(member.id)
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <span />
      </PopoverAnchor>
      <PopoverContent
        className="w-64 p-3"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {membersError ? (
          <p className="text-sm text-[hsl(var(--destructive))]">
            Failed to load members
          </p>
        ) : (
          <>
            {(members?.length ?? 0) > 10 && (
              <Input
                placeholder="Search members…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-2 h-8 text-xs"
              />
            )}
            <ul className="max-h-60 space-y-0.5 overflow-y-auto">
              {filteredMembers.map((member) => {
                const isAssigned = assignedUserIds.has(member.id)
                const isInFlight = inFlightUserIds.has(member.id)
                return (
                  <li key={member.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-muted ${isInFlight ? "cursor-not-allowed opacity-50" : ""
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        disabled={isInFlight}
                        onChange={() => handleToggle(member)}
                        className="h-4 w-4 rounded border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
                      />
                      <span className="truncate">
                        {member.displayName || member.email}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
