import { Link } from "react-router";
import { ShootingStarIcon } from "../../../icons";

/**
 * AI Insights placeholder. Proactive, auto-generated insights are not built
 * yet — this card says so plainly and links to the real Sentrix Assistant
 * (features/core), rather than inventing a new "coming soon" primitive
 * (mirrors the dashed-border shell language of components/shared/ComingSoon,
 * sized for this grid instead of a full page).
 */
export default function AIInsightsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center dark:border-gray-700 dark:bg-white/[0.03]">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
        <ShootingStarIcon className="size-6" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-gray-800 dark:text-white/90">AI Insights</h3>
      <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
        Proactive, auto-generated operational insights are coming soon. In the
        meantime, ask the Sentrix Assistant directly.
      </p>
      <Link
        to="/assistant"
        className="mt-4 text-theme-sm font-medium text-brand-500 hover:text-brand-600"
      >
        Open Assistant
      </Link>
    </div>
  );
}
