/**
 * Shared "coming soon" shell stub for navigation destinations whose feature page
 * is not built yet. This is shell scaffolding, NOT operational content.
 */
export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-white/[0.03]">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-white/10 dark:text-white/90">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
      <h3 className="mt-5 text-lg font-semibold text-gray-800 dark:text-white/90">
        {title} — coming soon
      </h3>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
        The shell, authorization, and navigation for this section are in place.
        The feature screens will be built against the documented Sentrix API in a
        later phase.
      </p>
    </div>
  );
}
