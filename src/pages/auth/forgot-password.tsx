import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { Link, useNavigate } from "react-router-dom"
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
import { useForgotPassword, extractErrorMessage } from "@/hooks/use-auth"

const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const forgotPassword = useForgotPassword()
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  function onSubmit(data: ForgotPasswordFormValues) {
    forgotPassword.mutate(data, { onSuccess: () => navigate("/reset-password") })
  }

  return (
    <AuthLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-center">Forgot Password</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] text-center">
          Enter your email and we&apos;ll send you a reset code.
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
            <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
              {forgotPassword.isPending ? "Sending..." : "Send Reset Code"}
            </Button>
          </form>
        </Form>
        {forgotPassword.error && (
          <p className="text-sm text-[hsl(var(--destructive))] text-center">
            {extractErrorMessage(forgotPassword.error)}
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
