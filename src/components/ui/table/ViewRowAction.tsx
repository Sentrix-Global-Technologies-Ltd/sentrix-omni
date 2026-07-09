import { Link } from "react-router";
import { EyeIcon } from "../../../icons";

interface Props {
  /** Route this action navigates to — same destination as clicking the row. */
  to: string;
  label?: string;
}

/**
 * Shared "Actions" cell for list tables: an eye icon that shows a "View"
 * tooltip on hover and links to the row's detail route. Used by the
 * Incidents, Emergencies, Responders, and Assignments tables so the pattern
 * isn't reinvented per feature — pair with a Column whose header is "Actions".
 *
 * Stops click propagation so it doesn't double-fire the table row's own
 * onRowClick handler; it's a real <Link> so ctrl/cmd-click still opens a new tab.
 */
export default function ViewRowAction({ to, label = "View" }: Props) {
  return (
    <div className="group/view relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <Link
        to={to}
        aria-label={label}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
      >
        <EyeIcon className="fill-current size-4" />
      </Link>
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-theme-xs text-white opacity-0 transition-opacity duration-150 group-hover/view:opacity-100 dark:bg-gray-700"
      >
        {label}
      </span>
    </div>
  );
}
