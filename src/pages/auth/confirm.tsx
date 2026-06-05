import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { Link } from "react-router-dom"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { useConfirm, extractErrorMessage } from "@/hooks/use-auth"

const confirmSchema = z.object({
  email: z.email("Invalid email address"),
  code: z.string().min(1, "Confirmation code is required"),
})

type ConfirmFormValues = z.infer<typeof confirmSchema>

export default function ConfirmPage() {
  const confirm = useConfirm()
  const form = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { email: "", code: "" },
  })

  function onSubmit(data: ConfirmFormValues) {
    confirm.mutate(data)
  }

  return (
    <AuthLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-center">Confirm Account</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] text-center">
          Enter the confirmation code sent to your email.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmation Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={confirm.isPending}>
              {confirm.isPending ? "Confirming..." : "Confirm"}
            </Button>
          </form>
        </Form>
        {confirm.error && (
          <p className="text-sm text-[hsl(var(--destructive))] text-center">
            {extractErrorMessage(confirm.error)}
          </p>
        )}
        <p className="text-sm text-center">
          <Link to="/login" className="text-[hsl(var(--primary))] hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
