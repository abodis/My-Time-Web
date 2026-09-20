import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { Tag, FolderKanban, Timer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InlineConcept } from "@/components/onboarding/inline-concept"
import { useCreateTag } from "@/hooks/use-tags"
import { useCreateProject } from "@/hooks/use-projects"
import { useCreateActivity } from "@/hooks/use-activities"
import { useOnboardingStore } from "@/stores/onboarding-store"

// The guided chain creates the owner's first real tag → project → activity in
// order. Each created id feeds the next step's creation (tag → activity,
// project → activity). Tag color is forced to the "blue" name token (Req 6.2);
// the activity is auto-assigned to the requesting owner server-side (Req 6.3).
type SubStep = "tag" | "project" | "activity"

// Per-sub-step schemas (design.md GuidedChain). One required text field each.
const tagSchema = z.object({
  name: z.string().trim().min(1, "Enter a tag name").max(100, "Name must be 100 characters or less"),
})
const projectSchema = z.object({
  name: z.string().trim().min(1, "Enter a project name").max(100, "Name must be 100 characters or less"),
})
const activitySchema = z.object({
  name: z.string().trim().min(1, "Enter an activity name").max(100, "Name must be 100 characters or less"),
})

type TagFormData = z.infer<typeof tagSchema>
type ProjectFormData = z.infer<typeof projectSchema>
type ActivityFormData = z.infer<typeof activitySchema>

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again."
  }
  const err = error as Record<string, unknown>
  if (Array.isArray(err.detail) && err.detail.length > 0) {
    const first = err.detail[0] as { msg?: string }
    return first.msg ?? "Validation error. Please check your input."
  }
  if (typeof err.message === "string" && err.message.length > 0) {
    return err.message
  }
  return "Couldn't save that. Please try again."
}

export function GuidedChain() {
  const [subStep, setSubStep] = useState<SubStep>("tag")
  // Chain dependencies: the created tag/project ids feed the activity creation.
  const [tagId, setTagId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)

  const createTag = useCreateTag()
  const createProject = useCreateProject()
  const createActivity = useCreateActivity()

  if (subStep === "tag") {
    return (
      <TagSubStep
        onCreated={(id) => {
          setTagId(id)
          setSubStep("project")
        }}
        createTag={createTag}
      />
    )
  }

  if (subStep === "project") {
    return (
      <ProjectSubStep
        onCreated={(id) => {
          setProjectId(id)
          setSubStep("activity")
        }}
        createProject={createProject}
      />
    )
  }

  return (
    <ActivitySubStep
      tagId={tagId}
      projectId={projectId}
      createActivity={createActivity}
    />
  )
}

interface TagSubStepProps {
  onCreated: (tagId: string) => void
  createTag: ReturnType<typeof useCreateTag>
}

function TagSubStep({ onCreated, createTag }: TagSubStepProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: "" },
  })

  const onSubmit = async (data: TagFormData) => {
    setApiError(null)
    try {
      // Color forced to the "blue" name token per Req 6.2.
      const tag = await createTag.mutateAsync({ name: data.name, color: "blue" })
      useOnboardingStore.getState().recordCreated({ tag: tag.name })
      onCreated(tag.id)
    } catch (err: unknown) {
      setApiError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <InlineConcept
        icon={Tag}
        title="Tags are your billing codes"
        description="A tag groups work for reporting and rates — like Consulting or Design. We'll start you off with one in blue."
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="guided-tag-name">Tag name</Label>
        <Input id="guided-tag-name" type="text" placeholder="Consulting" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-[hsl(var(--destructive))]">{errors.name.message}</p>
        )}
      </div>

      {apiError && (
        <p className="text-xs text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 rounded-md px-3 py-2">
          {apiError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating tag..." : "Create tag"}
      </Button>
    </form>
  )
}

interface ProjectSubStepProps {
  onCreated: (projectId: string) => void
  createProject: ReturnType<typeof useCreateProject>
}

function ProjectSubStep({ onCreated, createProject }: ProjectSubStepProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "" },
  })

  const onSubmit = async (data: ProjectFormData) => {
    setApiError(null)
    try {
      const project = await createProject.mutateAsync({
        name: data.name,
        clientName: null,
        isBillable: true,
        startDate: null,
        endDate: null,
        budgetHours: null,
      })
      useOnboardingStore.getState().recordCreated({ project: project.name })
      onCreated(project.id)
    } catch (err: unknown) {
      setApiError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <InlineConcept
        icon={FolderKanban}
        title="Projects hold your activities"
        description="A project is a container for the work you track — a client engagement or an internal initiative."
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="guided-project-name">Project name</Label>
        <Input id="guided-project-name" type="text" placeholder="Acme Website" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-[hsl(var(--destructive))]">{errors.name.message}</p>
        )}
      </div>

      {apiError && (
        <p className="text-xs text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 rounded-md px-3 py-2">
          {apiError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating project..." : "Create project"}
      </Button>
    </form>
  )
}

interface ActivitySubStepProps {
  tagId: string | null
  projectId: string | null
  createActivity: ReturnType<typeof useCreateActivity>
}

function ActivitySubStep({ tagId, projectId, createActivity }: ActivitySubStepProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: { name: "" },
  })

  const onSubmit = async (data: ActivityFormData) => {
    setApiError(null)
    if (!projectId || !tagId) {
      setApiError("Something went wrong setting up your workspace. Please try again.")
      return
    }
    try {
      // assignCreator:true assigns the owner to the activity in the same
      // transaction, so it appears on their tracker immediately — GET /activities
      // lists only assigned activities (Req 6.3).
      const activity = await createActivity.mutateAsync({
        projectId,
        body: { name: data.name, tagId, rateOverride: null, assignCreator: true },
      })
      useOnboardingStore.getState().recordCreated({ activity: activity.name })
      // All three created — advance the wizard to the invite step (Req 6.7).
      useOnboardingStore.getState().goTo("invite")
    } catch (err: unknown) {
      setApiError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <InlineConcept
        icon={Timer}
        title="Activities are what you track time against"
        description="An activity lives under your project and carries the tag. We'll assign this one to you so you can start the timer right away."
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="guided-activity-name">Activity name</Label>
        <Input id="guided-activity-name" type="text" placeholder="Kickoff" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-[hsl(var(--destructive))]">{errors.name.message}</p>
        )}
      </div>

      {apiError && (
        <p className="text-xs text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 rounded-md px-3 py-2">
          {apiError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating activity..." : "Create activity"}
      </Button>
    </form>
  )
}
