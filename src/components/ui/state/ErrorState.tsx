import Button from "../button/Button";
import { ApiError, userMessage } from "../../../services/api/errors";

interface ErrorStateProps {
  error?: unknown;
  onRetry?: () => void;
  title?: string;
}

/** Shared error state. Shows the sanitised API message, a support reference, and an optional retry. */
export default function ErrorState({ error, onRetry, title = "Something went wrong" }: ErrorStateProps) {
  // ApiError messages are already sanitised (see services/api/errors); any other
  // thrown value (TypeError, render error) is never echoed to the user.
  const message = userMessage(error, "An unexpected error occurred.");
  const requestId = error instanceof ApiError ? error.requestId : undefined;

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-error-50 text-error-500 dark:bg-error-500/10">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </span>
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
        {requestId && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Reference: {requestId}</p>
        )}
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
