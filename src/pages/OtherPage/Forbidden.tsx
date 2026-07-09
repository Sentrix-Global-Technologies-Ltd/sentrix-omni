import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

/**
 * 403 shown inside the shell when a user reaches a route they're not authorized
 * for (defense-in-depth behind the hidden nav). The backend remains the real
 * authority.
 */
export default function Forbidden() {
  return (
    <>
      <PageMeta title="Not authorized | Sentrix Console" description="Access denied" />
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-error-50 text-error-500 dark:bg-error-500/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </span>
        <h3 className="mt-5 text-lg font-semibold text-gray-800 dark:text-white/90">
          You don't have access to this section
        </h3>
        <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
          Your account isn't authorized to view this page. If you believe this is
          a mistake, contact your organization administrator.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          Back to dashboard
        </Link>
      </div>
    </>
  );
}
