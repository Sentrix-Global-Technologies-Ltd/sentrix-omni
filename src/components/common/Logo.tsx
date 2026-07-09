interface LogoProps {
  /** Render only the shield mark (collapsed sidebar). */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Sentrix brand lockup — a shield mark + wordmark. Self-contained (no image
 * assets) and theme-aware: the mark uses the brand color, the wordmark adapts to
 * light/dark.
 */
export default function Logo({ iconOnly = false, className = "" }: LogoProps) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-theme-xs">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 2.5 4.5 5.6v5.2c0 4.6 3.2 8.2 7.5 9.7 4.3-1.5 7.5-5.1 7.5-9.7V5.6L12 2.5Z"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <path
            d="M9 12.2l2 2 4-4.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!iconOnly && (
        <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Sentrix
        </span>
      )}
    </span>
  );
}
