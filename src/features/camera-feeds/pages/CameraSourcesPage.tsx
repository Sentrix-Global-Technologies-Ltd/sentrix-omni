import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { createPortal } from "react-dom";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Pagination from "../../../components/ui/pagination/Pagination";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import { useToast } from "../../../components/shared/toast";
import { useCameraFeeds } from "../hooks/useCameraFeeds";
import { useDeleteCameraSource } from "../hooks/useCameraSourceActions";
import { CAMERA_SOURCE_TYPES } from "../components/cameraSourceTypeMeta";
import CameraSourcesRichTable from "../components/CameraSourcesRichTable";
import AddCameraSourceDrawer from "../components/AddCameraSourceDrawer";
import EditCameraSourceDrawer from "../components/EditCameraSourceDrawer";
import CameraSourceDetailDrawer from "../components/CameraSourceDetailDrawer";
import CameraSourceKpiCard from "../components/CameraSourceKpiCard";
import type { CameraSource } from "../api/camera-feeds.types";
import "../styles/camera-sources.css";
import { userMessage } from "../../../services/api/errors";

/** Source types considered field / mobile — used by the "Field sources" additional filter. */
const FIELD_SOURCE_TYPES = new Set(["phone", "dashcam", "smart_glasses"]);

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

// ── Inline KPI icons ────────────────────────────────────────────────────────

function IconCamera() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14" />
      <rect x="1" y="6" width="14" height="12" rx="2" ry="2" />
    </svg>
  );
}

function IconWifi() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0114.08 0" />
      <path d="M1.42 9a16 16 0 0121.16 0" />
      <path d="M8.53 16.11a6 6 0 016.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.5" />
    </svg>
  );
}

function IconWifiOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
      <path d="M5 12.55a11 11 0 015.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0122.56 9" />
      <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
      <path d="M8.53 16.11a6 6 0 016.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.5" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

/**
 * Camera Sources management console — dedicated page under Vision Guard nav.
 */
export default function CameraSourcesPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [site, setSite] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CameraSource | null>(null);
  const [viewTarget, setViewTarget] = useState<CameraSource | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Additional-filters popover ─────────────────────────────────────────────
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [filterPopoverStyle, setFilterPopoverStyle] = useState<React.CSSProperties>({});
  const [filterHealthWarnings, setFilterHealthWarnings] = useState(false);
  const [filterHasTags, setFilterHasTags] = useState(false);
  const [filterFieldSources, setFilterFieldSources] = useState(false);

  // filterBtnRef: on the wrapper div, used for outside-click detection on button side
  const filterBtnRef = useRef<HTMLDivElement>(null);
  // filterBtnElRef: on the <button> itself, used to measure position for the portal
  const filterBtnElRef = useRef<HTMLButtonElement>(null);
  // filterPopoverRef: on the portal popover div, so clicks inside it don't close it
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterPopoverOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inBtn = filterBtnRef.current?.contains(target) ?? false;
      const inPop = filterPopoverRef.current?.contains(target) ?? false;
      if (!inBtn && !inPop) setFilterPopoverOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterPopoverOpen]);

  const handleFilterToggle = () => {
    if (filterPopoverOpen) { setFilterPopoverOpen(false); return; }
    if (!filterBtnElRef.current) return;
    const rect = filterBtnElRef.current.getBoundingClientRect();
    const popoverWidth = 260;
    // Align to left edge of button; clamp so it stays inside viewport
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 8) {
      left = window.innerWidth - popoverWidth - 8;
    }
    if (left < 8) left = 8;
    setFilterPopoverStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left,
      zIndex: 9999,
      minWidth: popoverWidth,
    });
    setFilterPopoverOpen(true);
  };

  const query = useCameraFeeds({ q, type, status, site, page });
  const del = useDeleteCameraSource();
  const toast = useToast();

  const rawSources = useMemo(() => query.data?.data ?? [], [query.data]);

  // Open the detail drawer when the URL carries ?view=<sourceId>
  // (set by LiveMonitoringPage "View Camera Details" button)
  useEffect(() => {
    const viewId = searchParams.get("view");
    if (!viewId || rawSources.length === 0) return;
    const found = rawSources.find((s) => s.id === viewId);
    if (found) {
      setViewTarget(found);
      // Remove the param so navigating back doesn't re-open
      setSearchParams((prev) => { prev.delete("view"); return prev; }, { replace: true });
    }
  }, [rawSources, searchParams, setSearchParams]);

  /** Apply client-side additional filters over the already-fetched page. */
  const sources = useMemo(() => {
    let list = rawSources;
    if (filterHealthWarnings) list = list.filter((s) => s.health_score !== null && s.health_score < 80);
    if (filterHasTags)        list = list.filter((s) => s.tags.length > 0);
    if (filterFieldSources)   list = list.filter((s) => FIELD_SOURCE_TYPES.has(s.type));
    return list;
  }, [rawSources, filterHealthWarnings, filterHasTags, filterFieldSources]);
  const meta = query.data?.meta as PaginatorMeta | undefined;

  const total  = meta?.total ?? rawSources.length;
  const online  = rawSources.filter((s) => s.feed_status === "live").length;
  const stale   = rawSources.filter((s) => s.feed_status === "stale").length;
  const offline = rawSources.filter(
    (s) => s.feed_status === "offline" || s.feed_status === "no_feed",
  ).length;

  const siteOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const s of rawSources) {
      if (s.site) seen.add(s.site);
    }
    return Array.from(seen).map((v) => ({ value: v, label: v }));
  }, [rawSources]);

  const handleDelete = async (source: CameraSource) => {
    if (!window.confirm(`Remove "${source.label}"? This cannot be undone.`)) return;
    try {
      await del.mutateAsync(source.id);
      toast.success(`${source.label} removed.`);
    } catch (e) {
      toast.error(userMessage(e, "Could not remove camera source."));
    }
  };

  const hasFilters = Boolean(q || type || status || site || filterHealthWarnings || filterHasTags || filterFieldSources);
  const hasAdditionalFilters = filterHealthWarnings || filterHasTags || filterFieldSources;

  return (
    <>
      <PageMeta
        title="Camera Sources | Sentrix Console"
        description="Manage and monitor all camera sources"
      />

      <PageHeader
        title="Camera Sources"
        description="Manage and monitor every registered camera source across your organisation."
        breadcrumbs={[{ label: "Vision Guard" }, { label: "Camera Sources" }]}
        actions={
          <Can permission="bridges.manage">
            <Button size="sm" variant="primary" onClick={() => setDrawerOpen(true)}>
              + Add Camera Source
            </Button>
          </Can>
        }
      />

      {/* KPI row */}
      <div className="cs-kpi-grid mb-6">
        <CameraSourceKpiCard label="Total Sources" value={total} tone="teal" icon={<IconCamera />} loading={query.isLoading} />
        <CameraSourceKpiCard label="Online" value={online} tone="green" icon={<IconWifi />} loading={query.isLoading} />
        <CameraSourceKpiCard label="Offline" value={offline} tone="orange" icon={<IconWifiOff />} loading={query.isLoading} />
        <CameraSourceKpiCard label="Maintenance" value={stale} tone="gray" icon={<IconWrench />} loading={query.isLoading} />
      </div>

      {/* Filter row */}
      <div className="cs-filter-row">
        {/* Search */}
        <div className="cs-filter-search">
          <span className="cs-filter-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search sources…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>

        {/* Source Type */}
        <select className="cs-filter-select" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {CAMERA_SOURCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Status */}
        <select className="cs-filter-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Site */}
        {siteOptions.length > 0 && (
          <select className="cs-filter-select" value={site} onChange={(e) => { setSite(e.target.value); setPage(1); }}>
            <option value="">All Sites</option>
            {siteOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        {/* Filters button — popover rendered via portal for mobile viewport safety */}
        <div ref={filterBtnRef} style={{ flex: "0 0 auto" }}>
          <button
            ref={filterBtnElRef}
            type="button"
            className="cs-filter-btn"
            onClick={handleFilterToggle}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filters
            {hasAdditionalFilters && <span className="cs-filter-btn-dot" />}
          </button>
        </div>

        {/* Clear link */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setQ(""); setType(""); setStatus(""); setSite(""); setFilterHealthWarnings(false); setFilterHasTags(false); setFilterFieldSources(false); setPage(1); }}
            className="text-theme-sm font-medium text-brand-500 hover:underline whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filters popover — portal-rendered so it is never clipped by ancestor overflow on mobile */}
      {filterPopoverOpen && createPortal(
        <div ref={filterPopoverRef} className="cs-filter-popover" style={filterPopoverStyle}>
          <p className="cs-filter-popover-title">Additional filters</p>

          <label className="cs-filter-popover-row">
            <input
              type="checkbox"
              checked={filterHealthWarnings}
              onChange={(e) => setFilterHealthWarnings(e.target.checked)}
              className="cs-filter-popover-check"
            />
            Has health warnings
          </label>

          <label className="cs-filter-popover-row">
            <input
              type="checkbox"
              checked={filterHasTags}
              onChange={(e) => setFilterHasTags(e.target.checked)}
              className="cs-filter-popover-check"
            />
            Has tags
          </label>

          <label className="cs-filter-popover-row">
            <input
              type="checkbox"
              checked={filterFieldSources}
              onChange={(e) => setFilterFieldSources(e.target.checked)}
              className="cs-filter-popover-check"
            />
            Field sources
          </label>

          <button
            type="button"
            className="cs-filter-popover-apply"
            onClick={() => setFilterPopoverOpen(false)}
          >
            Apply filters
          </button>
        </div>,
        document.body
      )}

      {/* Rich table */}
      <CameraSourcesRichTable
        sources={sources}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onDelete={(s) => void handleDelete(s)}
        onEdit={(s) => setEditTarget(s)}
        onView={(s) => setViewTarget(s)}
      />

      {/* Pagination / row count
          - Pagination component returns null when lastPage <= 1, so we render a simple
            row-count line for single-page results so the user always sees how many sources exist. */}
      {meta && (meta.last_page ?? 1) > 1 ? (
        <Pagination
          currentPage={meta.current_page ?? 1}
          lastPage={meta.last_page ?? 1}
          total={meta.total}
          from={meta.from}
          to={meta.to}
          onPageChange={setPage}
        />
      ) : meta && (meta.total ?? 0) > 0 ? (
        <p className="px-1 py-3 text-sm text-gray-500 dark:text-gray-400">
          Showing {meta.from ?? 1}–{meta.to ?? meta.total ?? 0} of {meta.total ?? 0} sources
        </p>
      ) : null}

      <AddCameraSourceDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <EditCameraSourceDrawer source={editTarget} onClose={() => setEditTarget(null)} />
      <CameraSourceDetailDrawer
          source={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={(s) => { setViewTarget(null); setEditTarget(s); }}
        />
    </>
  );
}
