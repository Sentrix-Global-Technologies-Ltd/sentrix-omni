import type { ReactNode } from "react";
import { Link } from "react-router";
import type { Tone } from "../ui/tone";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  loading?: boolean;
  /** Optional link target (whole card becomes clickable). */
  to?: string;
}

const iconTone: Record<Tone, string> = {
  primary: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
  success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
  info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
  light: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300",
  dark: "bg-gray-800 text-white",
};

/** Shared KPI/metric card. Extends the template's metric-card pattern. */
export default function StatCard({ label, value, icon, tone = "light", loading, to }: StatCardProps) {
  const body = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      {icon && (
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconTone[tone]}`}>
          {icon}
        </span>
      )}
      <div className="mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className="mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
          {loading ? "—" : value}
        </h4>
      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
