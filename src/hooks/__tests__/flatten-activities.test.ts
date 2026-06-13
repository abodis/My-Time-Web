// Feature: code-quality-refactor, Property 2: Activity flattening preserves all activities with correct project names
import { describe, it, expect } from "vitest"
import fc from "fast-check"
import { flattenActivities } from "@/hooks/use-tracker-data"
import type { components } from "@/api/schema"

type ProjectResponse = components["schemas"]["ProjectResponse"]
type ActivityResponse = components["schemas"]["ActivityResponse"]

/**
 * **Validates: Requirements 1.1**
 *
 * Generates arrays of non-archived projects with corresponding activity arrays.
 * Each activity's projectId matches its parent project's id.
 */
function projectsWithActivitiesArbitrary(): fc.Arbitrary<{
  projects: ProjectResponse[]
  activityResults: Array<ActivityResponse[] | undefined>
}> {
  return fc
    .array(
      fc.tuple(
        fc.uuid(),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.array(
          fc.tuple(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 30 }),
            fc.uuid(),
          ),
          { minLength: 0, maxLength: 8 },
        ),
        fc.boolean(), // whether activityResults[i] is undefined
      ),
      { minLength: 0, maxLength: 6 },
    )
    .map((items) => {
      const projects: ProjectResponse[] = []
      const activityResults: Array<ActivityResponse[] | undefined> = []

      for (const [projectId, accountId, projectName, activityTuples, isUndefined] of items) {
        projects.push({
          id: projectId,
          accountId,
          name: projectName,
          isArchived: false,
          isBillable: true,
        })

        if (isUndefined) {
          activityResults.push(undefined)
        } else {
          activityResults.push(
            activityTuples.map(([actId, actName, tagId]) => ({
              id: actId,
              projectId,
              tagId,
              name: actName,
            } as ActivityResponse)),
          )
        }
      }

      return { projects, activityResults }
    })
}

describe("flattenActivities", () => {
  it(
    "Property 2: total length equals sum of all defined activity array lengths",
    () => {
      fc.assert(
        fc.property(projectsWithActivitiesArbitrary(), ({ projects, activityResults }) => {
          const result = flattenActivities(projects, activityResults)

          const expectedLength = activityResults.reduce(
            (sum, arr) => sum + (arr?.length ?? 0),
            0,
          )

          expect(result.length).toBe(expectedLength)
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "Property 2: each element's projectName equals the name of the project that contains it",
    () => {
      fc.assert(
        fc.property(projectsWithActivitiesArbitrary(), ({ projects, activityResults }) => {
          const result = flattenActivities(projects, activityResults)

          for (const flat of result) {
            const project = projects.find((p) => p.id === flat.projectId)
            expect(project).toBeDefined()
            expect(flat.projectName).toBe(project!.name)
          }
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "Property 2: each element preserves id, name, tagId, projectId from source activity",
    () => {
      fc.assert(
        fc.property(projectsWithActivitiesArbitrary(), ({ projects, activityResults }) => {
          const result = flattenActivities(projects, activityResults)

          // Build a set of all source activities for lookup
          const sourceActivities = new Map<string, ActivityResponse>()
          for (const arr of activityResults) {
            if (arr) {
              for (const act of arr) {
                sourceActivities.set(act.id, act)
              }
            }
          }

          for (const flat of result) {
            const source = sourceActivities.get(flat.id)
            expect(source).toBeDefined()
            expect(flat.name).toBe(source!.name)
            expect(flat.tagId).toBe(source!.tagId)
            expect(flat.projectId).toBe(source!.projectId)
          }
        }),
        { numRuns: 100 },
      )
    },
  )
})
