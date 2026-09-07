import React from "react"
import { Button } from "@/components/ui/button"

interface RouteErrorBoundaryProps {
  children: React.ReactNode
}

interface RouteErrorBoundaryState {
  hasError: boolean
}

export class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="mt-2 text-text-muted">
            This page crashed. The rest of the app is fine.
          </p>
          <Button className="mt-6" onClick={this.handleRetry}>
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
