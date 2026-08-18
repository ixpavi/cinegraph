import { Component, type ReactNode } from "react";
import { ErrorState } from "./States";

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[ui] Unhandled error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "var(--space-8) var(--space-5)" }}>
          <ErrorState
            title="The page crashed"
            subtitle="Something unexpected happened while rendering. Reloading usually fixes it."
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
