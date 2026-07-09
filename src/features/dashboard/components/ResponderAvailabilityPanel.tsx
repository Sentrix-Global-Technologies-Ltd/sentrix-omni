import { Link } from "react-router";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { useResponders } from "../../responders/hooks/useResponders";
import { responderStatusTone } from "../../responders/components/responderTone";
import type { ResponderStatus } from "../../responders/api/responders.types";

interface PaginatorMeta {
  total?: number;
}

function total(meta: unknown): number {
  return (meta as PaginatorMeta | undefined)?.total ?? 0;
}

const ROWS: { status: ResponderStatus; label: string }[] = [
  { status: "available", label: "Available" },
  { status: "engaged", label: "Engaged" },
  { status: "unavailable", label: "Unavailable" },
  { status: "off_duty", label: "Off duty" },
];

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/**
 * Responder availability breakdown — one status-filtered count per row (same
 * convention as the KPI cards, just read via `meta.total` instead of a card).
 * Stays live through the responders realtime hook mounted on the page.
 */
export default function ResponderAvailabilityPanel() {
  const available = useResponders({ status: "available" });
  const engaged = useResponders({ status: "engaged" });
  const unavailable = useResponders({ status: "unavailable" });
  const offDuty = useResponders({ status: "off_duty" });

  const counts: Record<ResponderStatus, { total: number; loading: boolean }> = {
    available: { total: total(available.data?.meta), loading: available.isLoading },
    engaged: { total: total(engaged.data?.meta), loading: engaged.isLoading },
    unavailable: { total: total(unavailable.data?.meta), loading: unavailable.isLoading },
    off_duty: { total: total(offDuty.data?.meta), loading: offDuty.isLoading },
    suspended: { total: 0, loading: false },
  };

  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          Responder availability
        </h3>
        <Link to="/responders" className="text-theme-sm font-medium text-brand-500 hover:text-brand-600">
          View roster
        </Link>
      </div>
      <div className="space-y-3">
        {ROWS.map((row) => (
          <div key={row.status} className="flex items-center justify-between">
            <StatusBadge tone={responderStatusTone[row.status]}>{row.label}</StatusBadge>
            <span className="tabular-nums font-semibold text-gray-800 dark:text-white/90">
              {counts[row.status].loading ? "—" : counts[row.status].total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
