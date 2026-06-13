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
import { useRegister, extractErrorMessage } from "@/hooks/use-auth"

const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useRegister()
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(data: RegisterFormValues) {
    register.mutate(data, { onSuccess: () => navigate("/confirm") })
  }

  return (
    <AuthLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-center">Create Account</h1>
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min 8 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={register.isPending}>
              {register.isPending ? "Creating account..." : "Register"}
            </Button>
          </form>
        </Form>
        {register.error && (
          <p className="text-sm text-[hsl(var(--destructive))] text-center">
            {extractErrorMessage(register.error)}
          </p>
        )}
        <p className="text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-[hsl(var(--primary))] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
