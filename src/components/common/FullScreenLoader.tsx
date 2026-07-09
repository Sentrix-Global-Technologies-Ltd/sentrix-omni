/** Centered spinner shown while the auth session is being resolved. */
export default function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500 dark:border-gray-800 dark:border-t-brand-500"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
