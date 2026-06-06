import { createBrowserRouter } from "react-router-dom"
import ProtectedRoute from "@/components/auth/protected-route"
import PublicOnlyRoute from "@/components/auth/public-only-route"
import AppShell from "@/components/layout/app-shell"
import LoginPage from "@/pages/auth/login"
import RegisterPage from "@/pages/auth/register"
import ConfirmPage from "@/pages/auth/confirm"
import ForgotPasswordPage from "@/pages/auth/forgot-password"
import ResetPasswordPage from "@/pages/auth/reset-password"
import TrackerPage from "@/pages/app/tracker"
import EntriesPage from "@/pages/app/entries"

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/confirm", element: <ConfirmPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: <TrackerPage /> },
          { path: "/entries", element: <EntriesPage /> },
        ],
      },
    ],
  },
])
