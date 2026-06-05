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
import { useResetPassword, extractErrorMessage } from "@/hooks/use-auth"

const resetPasswordSchema = z.object({
  email: z.email("Invalid email address"),
  code: z.string().min(1, "Reset code is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const resetPassword = useResetPassword()
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "", code: "", newPassword: "" },
  })

  function onSubmit(data: ResetPasswordFormValues) {
    resetPassword.mutate(data)
  }

  return (
    <AuthLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-center">Reset Password</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] text-center">
          Enter the code from your email and your new password.
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
                  <FormLabel>Reset Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min 8 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
              {resetPassword.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </Form>
        {resetPassword.error && (
          <p className="text-sm text-[hsl(var(--destructive))] text-center">
            {extractErrorMessage(resetPassword.error)}
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
