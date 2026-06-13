import { Suspense } from "react"
import { createBrowserRouter } from "react-router-dom"
import ProtectedRoute from "@/components/auth/protected-route"
import PublicOnlyRoute from "@/components/auth/public-only-route"
import AppShell from "@/components/layout/app-shell"
import { lazyWithRetry } from "@/lib/lazy-with-retry"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const LoginPage = lazyWithRetry(() => import("@/pages/auth/login"))
const RegisterPage = lazyWithRetry(() => import("@/pages/auth/register"))
const ConfirmPage = lazyWithRetry(() => import("@/pages/auth/confirm"))
const ForgotPasswordPage = lazyWithRetry(
  () => import("@/pages/auth/forgot-password"),
)
const ResetPasswordPage = lazyWithRetry(
  () => import("@/pages/auth/reset-password"),
)
const TrackerPage = lazyWithRetry(() => import("@/pages/app/tracker"))
const EntriesPage = lazyWithRetry(() => import("@/pages/app/entries"))

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: "/register",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <RegisterPage />
          </Suspense>
        ),
      },
      {
        path: "/confirm",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ConfirmPage />
          </Suspense>
        ),
      },
      {
        path: "/forgot-password",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
      {
        path: "/reset-password",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ResetPasswordPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: "/",
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <TrackerPage />
              </Suspense>
            ),
          },
          {
            path: "/entries",
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <EntriesPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
])
