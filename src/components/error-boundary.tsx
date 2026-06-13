import React from "react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center shadow">
            <h1 className="text-xl font-semibold text-[hsl(var(--card-foreground))]">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={this.handleRetry}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] shadow hover:bg-[hsl(var(--primary))]/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
