import { useState, useMemo } from "react";
import { Link } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadcrumb";
import ListToolbar from "../../../components/shared/ListToolbar";
import ListPagination from "../../../components/shared/ListPagination";
import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import "../../incidents/styles/incidents-centre.css";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { useRecentDetections } from "../hooks/useDetections";
import { detectionSeverityTone, relativeTime, titleCase } from "../components/detectionTone";
import { humanize } from "../../../lib/format";
import type { DetectionEvent } from "../api/detections.types";

// ── Risk score bar ────────────────────────────────────────────────────────────

function RiskBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 85 ? "bg-error-500" :
    pct >= 65 ? "bg-warning-500" :
    pct >= 40 ? "bg-blue-light-500" :
    "bg-gray-300 dark:bg-gray-600";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums text-xs font-semibold text-gray-700 dark:text-gray-300">{score}</span>
    </div>
  );
}

// ── Table column definitions ──────────────────────────────────────────────────

const COLUMNS: Column<DetectionEvent>[] = [
  {
    key: "name",
    header: "Name",
    render: (d) => (
      <span className="font-semibold text-gray-800 dark:text-white/90">{humanize(d.type)}</span>
    ),
  },
  {
    key: "location",
    header: "Location",
    render: (d) => (
      <span className="text-gray-600 dark:text-gray-400">
        {[d.site, d.zone].filter(Boolean).join(" — ") || "—"}
      </span>
    ),
  },
  {
    key: "risk",
    header: "Risk Score",
    render: (d) => <RiskBar score={d.risk_score} />,
  },
  {
    key: "status",
    header: "Status",
    render: (d) => (
      <StatusBadge tone={detectionSeverityTone[d.severity]}>
        {titleCase(d.severity)}
      </StatusBadge>
    ),
  },
  {
    key: "time",
    header: "Time Registered",
    render: (d) => (
      <span className="whitespace-nowrap text-gray-500 dark:text-gray-400">
        {d.received_at ? relativeTime(d.received_at) : "—"}
      </span>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    render: (d) =>
      d.incident_id ? (
        <Link
          to={`/incidents/${d.incident_id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
        >
          View Incident
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      ) : (
        <span className="text-xs text-gray-400 dark:text-gray-600">No incident</span>
      ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 10;

/**
 * DetectionsPage  –  /vision-guard/detections
 *
 * Severity summary cards + searchable, paginated data table.
 * Polls every 5 s via useRecentDetections.
 */
export default function DetectionsPage() {
  const { data: result, isLoading, error, refetch } = useRecentDetections({ limit: 50 });
  const detections = result?.data ?? [];

  // Client-side search
  const [search, setSearch]     = useState("");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage]         = useState(1);

  const filtered = useMemo<DetectionEvent[]>(() => {
    if (!search.trim()) return detections;
    const q = search.toLowerCase();
    return detections.filter(
      (d) =>
        humanize(d.type).toLowerCase().includes(q) ||
        (d.site ?? "").toLowerCase().includes(q) ||
        (d.zone ?? "").toLowerCase().includes(q) ||
        d.severity.toLowerCase().includes(q),
    );
  }, [detections, search]);

  // Reset to page 1 when search changes
  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handlePageSize = (size: number) => { setPageSize(size); setPage(1); };

  // Client-side pagination slice
  const lastPage  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage  = Math.min(page, lastPage);
  const from      = (safePage - 1) * pageSize;
  const pageRows  = filtered.slice(from, from + pageSize);

  // Severity counts (from full data set, not the filtered slice)
  const counts = {
    total:    detections.length,
    critical: detections.filter((d) => d.severity === "critical").length,
    high:     detections.filter((d) => d.severity === "high").length,
    moderate: detections.filter((d) => d.severity === "medium").length,
    low:      detections.filter((d) => d.severity === "low" || d.severity === "info").length,
  };

  return (
    <>
      <PageMeta title="Detections | Sentrix" description="Recent detection events from the Ingest pipeline" />
      <PageBreadcrumb pageTitle="Detections" />

      {/* ── Summary stat cards ─────────────────────────────────────────────── */}
      <div className="ic-kpi-grid mb-6">
        <div className="ic-stat-card">
          <div className="ic-stat-label">Total Detections</div>
          <div className="ic-stat-value">
            {isLoading ? <span className="ic-stat-skeleton" aria-label="Loading…" /> : counts.total.toLocaleString()}
          </div>
          <div className="ic-stat-accent ic-stat-accent--neutral" />
        </div>
        <div className="ic-stat-card">
          <div className="ic-stat-label">Critical</div>
          <div className="ic-stat-value">
            {isLoading ? <span className="ic-stat-skeleton" aria-label="Loading…" /> : counts.critical.toLocaleString()}
          </div>
          <div className="ic-stat-sub">Immediate response</div>
          <div className="ic-stat-accent ic-stat-accent--critical" />
        </div>
        <div className="ic-stat-card">
          <div className="ic-stat-label">High</div>
          <div className="ic-stat-value">
            {isLoading ? <span className="ic-stat-skeleton" aria-label="Loading…" /> : counts.high.toLocaleString()}
          </div>
          <div className="ic-stat-sub">Needs attention</div>
          <div className="ic-stat-accent ic-stat-accent--warning" />
        </div>
        <div className="ic-stat-card">
          <div className="ic-stat-label">Moderate</div>
          <div className="ic-stat-value">
            {isLoading ? <span className="ic-stat-skeleton" aria-label="Loading…" /> : counts.moderate.toLocaleString()}
          </div>
          <div className="ic-stat-sub">Monitor closely</div>
          <div className="ic-stat-accent ic-stat-accent--info" />
        </div>
        <div className="ic-stat-card">
          <div className="ic-stat-label">Low</div>
          <div className="ic-stat-value">
            {isLoading ? <span className="ic-stat-skeleton" aria-label="Loading…" /> : counts.low.toLocaleString()}
          </div>
          <div className="ic-stat-sub">Informational</div>
          <div className="ic-stat-accent ic-stat-accent--success" />
        </div>
      </div>

      {/* ── Table card ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Recent Detections
            </h3>
            {!isLoading && (
              <p className="mt-0.5 text-xs text-gray-400">
                {counts.total} events · auto-refreshes every 5 s
              </p>
            )}
          </div>
        </div>

        {/* Search + page size + refresh toolbar */}
        <ListToolbar
          search={search}
          onSearch={handleSearch}
          visibleCount={filtered.length}
          totalCount={isLoading ? null : detections.length}
          isLoading={isLoading}
          pageSize={pageSize}
          onPageSizeChange={handlePageSize}
          onRefresh={() => void refetch()}
          placeholder="Search by name, location, or severity…"
          refreshLabel="Refresh detections"
        />

        {/* Data table */}
        <DataTable
          columns={COLUMNS}
          rows={pageRows}
          rowKey={(d) => d.id}
          isLoading={isLoading}
          error={error}
          onRetry={() => void refetch()}
          loadingLabel="Loading recent detections…"
              emptyTitle="No recent detections"
          emptyDescription={
            search
              ? `No results for "${search}". Try a different search term.`
              : "Detections from the Ingest pipeline will appear here as they arrive."
          }
        />

        {/* Pagination */}
        {!isLoading && filtered.length > 0 && (
          <ListPagination
            currentPage={safePage}
            lastPage={lastPage}
            total={filtered.length}
            from={from + 1}
            to={Math.min(from + pageSize, filtered.length)}
            onPageChange={setPage}
          />
        )}
      </div>
    </>
  );
}
