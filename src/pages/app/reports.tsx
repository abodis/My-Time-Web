import { useState, useMemo } from "react"
import { useAccountStore } from "@/stores/account-store"
import { getDateRange } from "@/lib/time-utils"
import { useProjects } from "@/hooks/use-projects"
import { SegmentedControl } from "@/components/reports/segmented-control"
import { DateRangePicker, type DateRange } from "@/components/reports/date-range-picker"
import { PersonalTimePanel } from "@/components/reports/personal-time-panel"
import { ProjectBudgetPanel } from "@/components/reports/project-budget-panel"
import { FinancialPanel } from "@/components/reports/financial-panel"

const ROLE_LEVEL: Record<string, number> = { user: 0, manager: 1, admin: 2 }

const ALL_TABS = [
  { id: "my-time", label: "My Time", minLevel: 0 },
  { id: "project-budget", label: "Project Budget", minLevel: 1 },
  { id: "financial", label: "Financial", minLevel: 2 },
] as const

const GROUP_BY_OPTIONS = [
  { label: "By Tag", value: "tag" as const },
  { label: "By Activity", value: "activity" as const },
]

function stripMs(iso: string): string {
  return iso.replace(/\.\d{3}Z$/, "Z")
}

function getAllTimeRange(): DateRange {
  const from = new Date(2020, 0, 1)
  from.setHours(0, 0, 0, 0)
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  return { from: stripMs(from.toISOString()), to: stripMs(to.toISOString()) }
}

export default function ReportsPage() {
  const activeAccountId = useAccountStore((s) => s.activeAccountId)
  const accounts = useAccountStore((s) => s.accounts)
  const activeRole = accounts.find((a) => a.id === activeAccountId)?.role ?? "user"
  const userLevel = ROLE_LEVEL[activeRole] ?? 0

  const tabs = useMemo(
    () => ALL_TABS.filter((tab) => userLevel >= tab.minLevel),
    [userLevel]
  )

  const defaultRange = useMemo(() => getDateRange("this-week"), [])
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? "my-time")
  const [groupBy, setGroupBy] = useState<"tag" | "activity">("tag")
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined)

  const resolvedTab = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0]?.id ?? "my-time"

  const allTimeRange = useMemo(() => getAllTimeRange(), [])
  const { data: projectsData } = useProjects()
  const projects = projectsData ?? []

  return (
    <div className="p-6 wide:pt-0">
      <div className="rounded-2xl bg-white shadow-lg p-6">
        <div className="flex flex-col gap-6">
          {/* Top nav — report type pills */}
          <div className="flex justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  resolvedTab === tab.id
                    ? "bg-brand/10 text-brand"
                    : "text-text-muted hover:bg-surface-muted",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-3">
            {resolvedTab === "my-time" && (
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            )}
            {resolvedTab === "my-time" && (
              <div className="ml-auto">
                <SegmentedControl
                  options={GROUP_BY_OPTIONS}
                  value={groupBy}
                  onChange={setGroupBy}
                />
              </div>
            )}
          </div>

          {/* Panel content */}
          {resolvedTab === "my-time" && (
            <PersonalTimePanel from={dateRange.from} to={dateRange.to} groupBy={groupBy} />
          )}
          {resolvedTab === "project-budget" && (
            <ProjectBudgetPanel
              from={allTimeRange.from}
              to={allTimeRange.to}
              projectId={selectedProjectId}
              projects={projects}
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
            />
          )}
          {resolvedTab === "financial" && (
            <FinancialPanel
              from={allTimeRange.from}
              to={allTimeRange.to}
              projectId={selectedProjectId}
              projects={projects}
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
            />
          )}
        </div>
      </div>
    </div>
  )
}
