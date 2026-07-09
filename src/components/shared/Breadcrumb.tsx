import { Link } from "react-router";

export interface Crumb {
  label: string;
  /** Link target. Omit for the current (last) crumb. */
  to?: string;
}

/**
 * Breadcrumb system (shared). Always starts at Home; renders the provided trail.
 * Mirrors the template's breadcrumb styling.
 */
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: "Home", to: "/" }, ...items];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {crumb.to && !isLast ? (
                <Link
                  to={crumb.to}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {crumb.label}
                </span>
              )}
              {!isLast && (
                <svg
                  className="stroke-current text-gray-400"
                  width="17"
                  height="16"
                  viewBox="0 0 17 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
