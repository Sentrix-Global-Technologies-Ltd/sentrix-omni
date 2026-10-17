import type { ReactNode } from 'react';
import Badge from '../../../components/ui/badge/Badge';
import { ArrowUpIcon, ArrowDownIcon } from '../../../icons';

export interface VGStatCardProps {
  label: string;
  value: string | number;
  /** Change label e.g. "12%" — renders as a success/error Badge with arrow */
  change?: string;
  changeDir?: 'up' | 'down';
  icon: ReactNode;
  /** Bolt SVG sparkline path d-attribute (mock visual only) */
  spark?: string;
  loading?: boolean;
  /** MOCK: true when the displayed value is a Bolt reference placeholder */
  isMock?: boolean;
}

/**
 * VisionGuardStatCard — TailAdmin Pro EcommerceMetrics pattern.
 * Gray rounded-xl icon container, Outfit font, Sentrix Tailwind tokens.
 * No coloured circles — consistent with the rest of the dashboard.
 */
export default function VisionGuardStatCard({
  label, value, change, changeDir = 'up', icon, spark, loading, isMock,
}: VGStatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Icon container — TailAdmin EcommerceMetrics style */}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
        <span className="text-gray-800 dark:text-white/90">{icon}</span>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="text-theme-sm text-gray-500 dark:text-gray-400">{label}</span>
          <h4 className="mt-2 flex items-center gap-1 text-theme-xl font-bold text-gray-800 dark:text-white/90">
            {loading ? '…' : value}
            {isMock && !loading && (
              <span
                title="Mock value — no live API data available"
                className="text-[10px] opacity-40"
              >*</span>
            )}
          </h4>
        </div>

        {change && !loading && (
          <Badge size="sm" color={changeDir === 'up' ? 'success' : 'error'}>
            {changeDir === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {change}
          </Badge>
        )}
      </div>

      {/* Sparkline — subtle position-absolute decoration */}
      {spark && (
        <svg
          className="pointer-events-none absolute bottom-4 right-4 h-8 w-14 opacity-30"
          viewBox="0 0 62 38"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={spark}
            className="text-brand-500"
            stroke="currentColor"
            fill="none"
            strokeWidth="1.8"
          />
        </svg>
      )}
    </div>
  );
}
