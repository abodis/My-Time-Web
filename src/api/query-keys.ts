export const queryKeys = {
  projects: {
    all: () => ["projects"] as const,
    list: (params?: { includeArchived?: boolean }) =>
      ["projects", params ?? {}] as const,
    detail: (id: string) => ({
      queryKey: ["projects", id] as const,
      activities: {
        all: () => ["projects", id, "activities"] as const,
        list: () => ["projects", id, "activities", "list"] as const,
      },
    }),
  },
  activities: {
    all: () => ["activities"] as const,
    list: (params?: { includeDone?: boolean }) =>
      ["activities", params ?? {}] as const,
    byProject: (projectId: string) =>
      ["activities", projectId] as const,
    detail: (id: string) => ({
      queryKey: ["activities", id] as const,
      assignments: {
        all: () => ["activities", id, "assignments"] as const,
        list: () => ["activities", id, "assignments", "list"] as const,
      },
    }),
  },
  entries: {
    all: () => ["entries"] as const,
    list: (params: { from: string; to: string }) =>
      ["entries", params] as const,
  },
  tags: {
    all: () => ["tags"] as const,
    list: () => ["tags", "list"] as const,
  },
  members: {
    all: () => ["members"] as const,
    list: () => ["members", "list"] as const,
  },
  reports: {
    all: () => ["reports"] as const,
    personalTime: (params: { from: string; to: string; groupBy: string }) =>
      ["reports", "personal-time", params] as const,
    projectBudget: (params: { from: string; to: string; projectId?: string }) =>
      ["reports", "project-budget", params] as const,
    financial: (params: { from: string; to: string; projectId?: string }) =>
      ["reports", "financial", params] as const,
  },
  timer: {
    all: () => ["timer"] as const,
    current: () => ["timer", "current"] as const,
  },
  profile: {
    all: () => ["profile"] as const,
  },
  account: {
    all: () => ["account"] as const,
  },
  budgets: {
    all: () => ["budgets"] as const,
    list: () => ["budgets", "list"] as const,
    byProject: (projectId: string) => ["budgets", projectId] as const,
  },
  settings: {
    all: () => ["settings"] as const,
    activityColors: () => ["settings", "activity-colors"] as const,
  },
  entryNotes: {
    all: () => ["entry-notes"] as const,
    byEntry: (entryId: string) => ["entry-notes", entryId] as const,
  },
  palette: {
    all: () => ["palette"] as const,
  },
} as const
