import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorState from "../ui/state/ErrorState";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

/**
 * Catches render-time errors in a subtree and shows the shared ErrorState
 * instead of a blank screen. Wrap the routed content; key it by route so
 * navigating away clears a caught error.
 *
 * In dev it also surfaces the actual error + component stack on screen, so an
 * opaque "something went wrong" can be diagnosed without opening the console.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Hook for telemetry; logged so it's never silently swallowed.
    console.error("Unhandled UI error:", error, info?.componentStack);
    this.setState({ info });
  }

  render(): ReactNode {
    const { error, info } = this.state;
    if (error) {
      const detail =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : `Non-Error thrown: ${typeof error === "object" ? JSON.stringify(error) : String(error)}`;

      return (
        <div className="py-10">
          <ErrorState
            title="Something went wrong"
            error={error}
            onRetry={() => window.location.reload()}
          />
          {import.meta.env.DEV && (
            <details
              open
              className="mx-auto mt-6 max-w-3xl rounded-lg border border-error-200 bg-error-50/40 p-4 text-left dark:border-error-500/30 dark:bg-error-500/5"
            >
              <summary className="cursor-pointer text-sm font-medium text-error-600 dark:text-error-400">
                Developer detail (dev only)
              </summary>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">{detail}</p>
              {error instanceof Error && error.stack && (
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-theme-xs text-gray-600 dark:text-gray-400">
                  {error.stack}
                </pre>
              )}
              {info?.componentStack && (
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-theme-xs text-gray-500 dark:text-gray-500">
                  {info.componentStack}
                </pre>
              )}
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
