import { useMemo } from "react";
import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import { FileIcon, LockIcon, TimeIcon } from "../../../icons";
import { relativeTime, titleCase } from "./evidenceTone";
import type { Observation } from "../api/evidence.types";
import "../styles/evidence-console.css";

function severityClass(severity: string | null): string {
  switch (severity) {
    case "critical": return "ev-severity critical";
    case "high":     return "ev-severity high";
    case "medium":   return "ev-severity medium";
    case "low":      return "ev-severity low";
    default:         return "ev-severity info";
  }
}

interface Props {
  observations: Observation[];
  selected: Observation | null;
  onSelect: (o: Observation) => void;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/**
 * Responsive DataTable view for Evidence Vault observations.
 *
 * Column visibility:
 *   Observation  — always
 *   Kind         — always
 *   Severity     — hidden sm:table-cell  (≥640 px)
 *   Observed     — hidden md:table-cell  (≥768 px)
 *   Flags        — hidden lg:table-cell  (≥1024 px)
 */
export default function ObservationTable({
  observations,
  selected,
  onSelect,
  isLoading,
  error,
  onRetry,
}: Props) {
  const columns = useMemo<Column<Observation>[]>(() => [
    {
      key: "observation",
      header: "Observation",
      render: (o) => {
        const label = o.label ?? titleCase(o.kind);
        const sub = o.plate
          ? `Plate: ${o.plate}`
          : (o.attributes?.camera_name as string | undefined) ?? "—";
        return (
          <div className="flex items-center gap-3">
            <div className="ev-list-thumb shrink-0">
              {o.snapshot_url ? (
                <img src={o.snapshot_url} alt={label} loading="lazy" />
              ) : (
                <FileIcon className="size-4 opacity-40" />
              )}
            </div>
            <div className="ev-list-name">
              <strong>{label}</strong>
              <small>{sub}</small>
            </div>
          </div>
        );
      },
    },
    {
      key: "kind",
      header: "Kind",
      render: (o) => (
        <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
          {titleCase(o.kind)}
        </span>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
      render: (o) =>
        o.severity ? (
          <span className={severityClass(o.severity)}>{o.severity}</span>
        ) : (
          <span className="text-gray-300 dark:text-gray-700">—</span>
        ),
    },
    {
      key: "observed",
      header: "Observed",
      className: "hidden md:table-cell",
      headerClassName: "hidden md:table-cell",
      render: (o) => (
        <span className="ev-card-time">
          <TimeIcon className="size-3 opacity-60" />
          {o.observed_at ? relativeTime(o.observed_at) : "—"}
        </span>
      ),
    },
    {
      key: "flags",
      header: "Flags",
      className: "hidden lg:table-cell",
      headerClassName: "hidden lg:table-cell",
      render: (o) => (
        <div className="flex items-center gap-2">
          {o.hold && (
            <span className="ev-flag hold" title="Legal hold">
              <LockIcon className="size-3" />
            </span>
          )}
          {o.bookmarked && (
            <span className="ev-flag bookmarked" title="Bookmarked">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </span>
          )}
          {o.sealed && (
            <span className="text-[9px] font-semibold text-purple-500 dark:text-purple-400">
              SEALED
            </span>
          )}
          {!o.hold && !o.bookmarked && !o.sealed && (
            <span className="text-gray-300 dark:text-gray-700">—</span>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <DataTable
      columns={columns}
      rows={observations}
      rowKey={(o) => o.id}
      onRowClick={onSelect}
      rowClassName={(o) =>
        selected?.id === o.id
          ? "bg-brand-50 dark:bg-brand-900/10"
          : undefined
      }
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No observations"
      emptyDescription="No observations match the current filters."
      loadingLabel="Loading observations…"
    />
  );
}
