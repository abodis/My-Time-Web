import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/tags/color-picker"
import { SELECTABLE_COLORS, type ColorToken } from "@/lib/color-utils"
import { useCreateTag, useUpdateTag } from "@/hooks/use-tags"

const tagSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or fewer"),
  color: z.enum(SELECTABLE_COLORS as unknown as [string, ...string[]], {
    error: "Please select a color",
  }),
  defaultRate: z.string().refine((v) => v === "" || (Number(v) >= 0 && !isNaN(Number(v))), {
    message: "Must be 0 or greater",
  }),
  rateCurrency: z.string().max(3).refine((v) => v === "" || v.length === 3, {
    message: "Currency must be 3 characters (e.g., USD)",
  }),
})

type TagFormValues = z.infer<typeof tagSchema>

interface TagFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTag?: {
    id: string
    name: string
    color: ColorToken | null
    defaultRate: number | null | undefined
    rateCurrency: string | null | undefined
  } | null
}

export function TagFormDialog({ open, onOpenChange, editTag }: TagFormDialogProps) {
  const isEdit = Boolean(editTag)
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
      color: "" as unknown as ColorToken,
      defaultRate: "",
      rateCurrency: "",
    },
  })

  useEffect(() => {
    if (open && editTag) {
      reset({
        name: editTag.name,
        color: (editTag.color ?? "") as unknown as ColorToken,
        defaultRate: editTag.defaultRate != null ? String(editTag.defaultRate) : "",
        rateCurrency: editTag.rateCurrency ?? "",
      })
    } else if (open && !editTag) {
      reset({
        name: "",
        color: "" as unknown as ColorToken,
        defaultRate: "",
        rateCurrency: "",
      })
    }
  }, [open, editTag, reset])

  const selectedColor = watch("color") as ColorToken | ""

  function onSubmit(data: TagFormValues) {
    const payload = {
      name: data.name,
      color: data.color as ColorToken,
      defaultRate: data.defaultRate ? Number(data.defaultRate) : undefined,
      rateCurrency: data.rateCurrency || undefined,
    }

    if (isEdit && editTag) {
      updateTag.mutate(
        { id: editTag.id, ...payload },
        {
          onSuccess: () => onOpenChange(false),
        },
      )
    } else {
      createTag.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      })
    }
  }

  const mutationError = isEdit ? updateTag.error : createTag.error
  const isPending = isEdit ? updateTag.isPending : createTag.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tag" : "Create Tag"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the tag details below."
              : "Fill in the details to create a new tag."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="tag-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tag-name"
              {...register("name")}
              placeholder="e.g., Development"
              maxLength={100}
            />
            {errors.name && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.name.message}</p>
            )}
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>
              Color <span className="text-red-500">*</span>
            </Label>
            <ColorPicker
              value={selectedColor || null}
              onChange={(token) => setValue("color", token, { shouldValidate: true })}
            />
            {errors.color && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.color.message}</p>
            )}
          </div>

          {/* Rate + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tag-rate">Default Rate</Label>
              <Input
                id="tag-rate"
                type="number"
                min={0}
                step="any"
                {...register("defaultRate")}
                placeholder="0"
              />
              {errors.defaultRate && (
                <p className="text-xs text-[hsl(var(--destructive))]">
                  {errors.defaultRate.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tag-currency">Currency</Label>
              <Input
                id="tag-currency"
                {...register("rateCurrency")}
                placeholder="USD"
                maxLength={3}
              />
              {errors.rateCurrency && (
                <p className="text-xs text-[hsl(var(--destructive))]">
                  {errors.rateCurrency.message}
                </p>
              )}
            </div>
          </div>

          {/* API error */}
          {mutationError && (
            <p className="text-sm text-[hsl(var(--destructive))]">
              {(mutationError as { message?: string })?.message ??
                "Something went wrong. Please try again."}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save Changes"
                  : "Create Tag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
