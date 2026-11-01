import { useState, useCallback, useEffect, useMemo } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Tabs from "../../../components/shared/Tabs";
import CursorPagination, { type CursorMeta } from "../../../components/ui/pagination/CursorPagination";
import { GridIcon, ListIcon } from "../../../icons";
import ListToolbar from "../../../components/shared/ListToolbar";
import ObservationCard from "../components/ObservationCard";
import ObservationTable from "../components/ObservationTable";
import ObservationDetailsDrawer from "../components/ObservationDetailsDrawer";
import CollectionsTab from "../components/CollectionsTab";
import ExportsTab from "../components/ExportsTab";
import RetentionPolicyPanel from "../components/RetentionPolicyPanel";
import EvidenceAuditTab from "../components/EvidenceAuditTab";
import CustodyModal from "../components/CustodyModal";
import { useEvidenceSearch } from "../hooks/useEvidence";
import { useCameraFeeds } from "../../camera-feeds/hooks/useCameraFeeds";
import { KIND_OPTIONS } from "../components/evidenceTone";
import type { EvidenceFilters, Observation } from "../api/evidence.types";
import "../styles/evidence-console.css";

/* ─── Demo mode ─────────────────────────────────────────────────────────────
 * Demo observations are shown ONLY when:
 *   1. DEMO_ENABLED is true (set by DEV build or VITE_DEMO_MODE=true), AND
 *   2. The evidence search API returned a successful, empty result.
 *
 * Demo records are NEVER shown after an API failure (that surfaces as the
 * error state), and NEVER mixed into real API results.
 * ────────────────────────────────────────────────────────────────────────── */
const DEMO_ENABLED: boolean =
  import.meta.env.DEV === true || import.meta.env.VITE_DEMO_MODE === "true";

/**
 * Realistic demo observations for development / demonstration.
 *
 * Kind values match the backend ObservationKind enum exactly:
 *   face | vehicle | plate | object | scene | audio | behavior | thermal | sensor
 *
 * Thumbnails use existing public/images/grid-image assets (project-local, no
 * external network request). IDs are prefixed "demo-" so they can never be
 * accidentally routed to a real backend endpoint.
 */
const DEMO_OBSERVATIONS: Observation[] = [
  {
    id: "demo-1",
    organization_id: "demo-org",
    camera_source_id: null,
    kind: "vehicle",
    label: "Vehicle detected – Parking Level B",
    attributes: {
      camera_name: "CAM-PB-07",
      location_name: "Parking Level B",
      site_name: "HQ Building",
      make: "Sedan",
      color: "Silver",
    },
    plate: null,
    confidence: 0.94,
    severity: "low",
    snapshot_url: "/images/grid-image/image-01.png",
    clip_url: null,
    lat: null,
    lng: null,
    observed_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    hold: false,
    bookmarked: true,
    sealed: false,
    retention_tier: "hot",
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: "demo-2",
    organization_id: "demo-org",
    camera_source_id: null,
    kind: "face",
    label: "Unknown individual – Main Entrance",
    attributes: {
      camera_name: "CAM-ENT-01",
      location_name: "Main Entrance",
      site_name: "HQ Building",
    },
    plate: null,
    confidence: 0.87,
    severity: "medium",
    snapshot_url: "/images/grid-image/image-02.png",
    clip_url: null,
    lat: null,
    lng: null,
    observed_at: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    hold: true,
    bookmarked: false,
    sealed: false,
    retention_tier: "hot",
    created_at: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
  },
  {
    id: "demo-3",
    organization_id: "demo-org",
    camera_source_id: null,
    kind: "plate",
    label: "Plate read – LPR Camera North Gate",
    attributes: {
      camera_name: "LPR-NORTH-01",
      location_name: "North Gate",
      site_name: "HQ Building",
    },
    plate: "XKT-4892",
    confidence: 0.99,
    severity: null,
    snapshot_url: "/images/grid-image/image-03.png",
    clip_url: null,
    lat: null,
    lng: null,
    observed_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    hold: false,
    bookmarked: false,
    sealed: false,
    retention_tier: "hot",
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "demo-4",
    organization_id: "demo-org",
    camera_source_id: null,
    kind: "behavior",
    label: "Unusual motion pattern – South Corridor",
    attributes: {
      camera_name: "CAM-SC-03",
      location_name: "South Corridor",
      site_name: "HQ Building",
    },
    plate: null,
    confidence: 0.76,
    severity: "high",
    snapshot_url: "/images/grid-image/image-04.png",
    clip_url: null,
    lat: null,
    lng: null,
    observed_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    hold: false,
    bookmarked: true,
    sealed: false,
    retention_tier: "hot",
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: "demo-5",
    organization_id: "demo-org",
    camera_source_id: null,
    kind: "scene",
    label: "Scene snapshot – Lobby overview",
    attributes: {
      camera_name: "CAM-LOBBY-01",
      location_name: "Main Lobby",
      site_name: "HQ Building",
    },
    plate: null,
    confidence: null,
    severity: null,
    snapshot_url: "/images/grid-image/image-05.png",
    clip_url: null,
    lat: null,
    lng: null,
    observed_at: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
    hold: false,
    bookmarked: false,
    sealed: false,
    retention_tier: "warm",
    created_at: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
  },
  {
    id: "demo-6",
    organization_id: "demo-org",
    camera_source_id: null,
    kind: "audio",
    label: "Audio anomaly detected – Server Room",
    attributes: {
      camera_name: "MIC-SR-02",
      location_name: "Server Room",
      site_name: "HQ Building",
    },
    plate: null,
    confidence: 0.82,
    severity: "medium",
    snapshot_url: "/images/grid-image/image-06.png",
    clip_url: null,
    lat: null,
    lng: null,
    observed_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    hold: false,
    bookmarked: false,
    sealed: false,
    retention_tier: "warm",
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
];

/* ─── Tab config ─────────────────────────────────────────────────────────── */
const TABS = [
  { key: "observations", label: "Observations" },
  { key: "collections", label: "Collections" },
  { key: "exports", label: "Exports" },
  { key: "retention", label: "Retention Policy" },
  { key: "audit", label: "Audit Log" },
];

/* ─── Inline SVG helpers ─────────────────────────────────────────────────── */
function FilterSVG() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function EvidenceConsolePage() {
  const [tab, setTab] = useState("observations");
  const [filters, setFilters] = useState<EvidenceFilters>({});
  const [perPage, setPerPage] = useState(25);
  const [uiSearch, setUiSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Observation | null>(null);
  const [custodyTarget, setCustodyTarget] = useState<Observation | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Merge per_page into the server query without storing it in the filters shape
  const activeFilters = useMemo<EvidenceFilters>(
    () => ({ ...filters, per_page: perPage }),
    [filters, perPage],
  );
  const search = useEvidenceSearch(activeFilters);
  /** Camera sources — used for the camera-source filter dropdown.
   * Loaded lazily only when the filter panel is open; the hook always fetches
   * when the component mounts, but the result is displayed only in the panel. */
  const cameraFeeds = useCameraFeeds({});
  const cameraSourceOptions = cameraFeeds.data?.data ?? [];

  const realObservations = search.data?.data ?? [];
  const meta = search.data?.meta as CursorMeta | undefined;

  /*
   * isDemo is true ONLY when:
   *   - demo mode is explicitly enabled (DEV build or VITE_DEMO_MODE=true), AND
   *   - the search API completed successfully with zero results.
   * It is NEVER true after an API failure (search.error case is handled
   * separately below) and NEVER true when real records are present.
   */
  const isDemo =
    DEMO_ENABLED &&
    !search.isLoading &&
    !search.error &&
    realObservations.length === 0;

  // In demo mode, apply the active kind filter so category clicks have a
  // visible effect on the displayed list (the API returns 0 real results in
  // demo mode so the kind filter never narrows real data; we apply it locally
  // to the demo dataset so the UI is consistent).
  const displayObservations = isDemo
    ? (filters.kind
        ? DEMO_OBSERVATIONS.filter((o) => o.kind === filters.kind)
        : DEMO_OBSERVATIONS)
    : realObservations;

  // Client-side search over the currently loaded page (label, kind, plate, camera name).
  const visibleObservations = useMemo(() => {
    if (!uiSearch.trim()) return displayObservations;
    const q = uiSearch.toLowerCase();
    return displayObservations.filter(
      (o) =>
        (o.label ?? "").toLowerCase().includes(q) ||
        o.kind.toLowerCase().includes(q) ||
        (o.plate ?? "").toLowerCase().includes(q) ||
        ((o.attributes?.camera_name as string | undefined) ?? "").toLowerCase().includes(q) ||
        ((o.attributes?.location_name as string | undefined) ?? "").toLowerCase().includes(q),
    );
  }, [displayObservations, uiSearch]);

  // Clear the selected observation when it no longer appears in the current
  // display set (e.g. after a kind filter narrows the results or a refresh
  // removes the record from the page).
  useEffect(() => {
    if (selected && !visibleObservations.some((o) => o.id === selected.id)) {
      setSelected(null);
    }
  }, [visibleObservations, selected]);

  const update = useCallback((next: Partial<EvidenceFilters>) =>
    setFilters((f) => ({ ...f, ...next, cursor: undefined })), []);
  const clear = useCallback(() => setFilters({}), []);
  const setCursor = useCallback((cursor: string | null) => {
    setFilters((f) => ({ ...f, cursor: cursor ?? undefined }));
    setUiSearch("");
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPerPage(size);
    setFilters((f) => ({ ...f, cursor: undefined }));
    setUiSearch("");
  }, []);

  /*
   * Demo records open the details panel like any other card, but they are
   * non-actionable: the drawer shows "Actions unavailable for demo records."
   * and disables hold/bookmark/custody because those cannot run against demo IDs.
   */
  const handleCardClick = useCallback((o: Observation) => {
    setSelected((prev) => prev?.id === o.id ? null : o);
  }, []);

  const closeDrawer = useCallback(() => setSelected(null), []);

  // Any active filter (excluding cursor) — used to offer "Clear filters" in the empty state.
  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => k !== "cursor" && v !== undefined && v !== "",
  );

  return (
    <>
      <PageMeta title="Evidence | Sentrix Console" description="Evidence vault and observations" />
      <PageHeader title="Evidence Vault" breadcrumbs={[{ label: "Vision Guard" }, { label: "Evidence Vault" }]} />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── Observations tab ─────────────────────────────────────────── */}
      {tab === "observations" && (
        <>
          {/*
           * Demo banner — visible only when demo mode is active.
           * Clearly distinguishes demo content from real operational evidence.
           */}
          {isDemo && (
            <div className="ev-demo-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Demo data — showing representative examples. Connect to the API to see real evidence. Actions are unavailable for demo records.
            </div>
          )}

          {/* ── Toolbar row: ListToolbar + Filters toggle + view mode ── */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <ListToolbar
                search={uiSearch}
                onSearch={setUiSearch}
                visibleCount={visibleObservations.length}
                totalCount={null}
                isLoading={search.isLoading}
                pageSize={perPage}
                onPageSizeChange={handlePageSizeChange}
                onRefresh={() => void search.refetch()}
                placeholder="Search label, kind, plate, or camera…"
                refreshLabel="Refresh observations"
              />
            </div>
            <button
              className={`ev-filters-btn${showFilters ? " active" : ""}`}
              onClick={() => setShowFilters((v) => !v)}
            >
              <FilterSVG />
              Filters
            </button>
            <div className="ev-view-toggle">
              <button
                className={`ev-view-btn${viewMode === "grid" ? " active" : ""}`}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <GridIcon className="size-3.5" />
              </button>
              <button
                className={`ev-view-btn${viewMode === "list" ? " active" : ""}`}
                onClick={() => setViewMode("list")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <ListIcon className="size-3.5" />
              </button>
            </div>
          </div>

          {/* ── Collapsible filter panel ─────────────────────────────── */}
          {showFilters && (
            <div className="ev-filter-panel">
              <div className="ev-filter-groups">

                {/* ── Group 1: Evidence classification ────────────────── */}
                <div className="ev-filter-group">
                  <div className="ev-filter-group-label">Evidence</div>
                  {/* Kind spans full group width */}
                  <label style={{ gridColumn: "1 / -1" }}>
                    Kind
                    <select
                      value={filters.kind ?? ""}
                      onChange={(e) => update({ kind: (e.target.value as EvidenceFilters["kind"]) || undefined })}
                    >
                      <option value="">All kinds</option>
                      {KIND_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* ── Group 2: Source and time ─────────────────────────── */}
                <div className="ev-filter-group">
                  <div className="ev-filter-group-label">Source &amp; Time</div>
                  <div className="ev-filter-group-grid">
                    {/*
                     * Camera source — full width; From / To share the second row.
                     * Populated from useCameraFeeds (same hook as Live Monitoring
                     * and Hardware Console). Selects by UUID; clearing emits undefined.
                     */}
                    <label style={{ gridColumn: "1 / -1" }}>
                      Camera Source
                      <select
                        value={filters.camera_source_id ?? ""}
                        onChange={(e) => update({ camera_source_id: e.target.value || undefined })}
                        disabled={cameraFeeds.isLoading}
                      >
                        <option value="">
                          {cameraFeeds.isLoading ? "Loading…" : "All cameras"}
                        </option>
                        {cameraSourceOptions.map((src) => (
                          <option key={src.id} value={src.id}>{src.label}</option>
                        ))}
                      </select>
                    </label>
                    {/*
                     * Date range — stored as YYYY-MM-DD; API appends T23:59:59 to `to`
                     * so Carbon::parse resolves end-of-day UTC.
                     */}
                    <label>
                      From
                      <input
                        type="date"
                        value={filters.from ?? ""}
                        max={filters.to ?? undefined}
                        onChange={(e) => update({ from: e.target.value || undefined })}
                      />
                    </label>
                    <label>
                      To
                      <input
                        type="date"
                        value={filters.to ?? ""}
                        min={filters.from ?? undefined}
                        onChange={(e) => update({ to: e.target.value || undefined })}
                      />
                    </label>
                  </div>
                </div>

                {/* ── Group 3: Attributes ──────────────────────────────── */}
                <div className="ev-filter-group">
                  <div className="ev-filter-group-label">Attributes</div>
                  {/*
                   * JSONB attribute facets — substring match against the `attributes`
                   * JSONB column (backend ATTRIBUTE_FACETS allowlist). Plate is a
                   * top-level column. Make omitted per design; Color/Plate share row 1,
                   * Model/Item share row 2.
                   */}
                  <div className="ev-filter-group-grid">
                    <label>
                      Plate
                      <input
                        type="text"
                        value={filters.plate ?? ""}
                        placeholder="e.g. ABC123"
                        onChange={(e) => update({ plate: e.target.value || undefined })}
                      />
                    </label>
                    <label>
                      Color
                      <input
                        type="text"
                        value={filters.color ?? ""}
                        placeholder="e.g. Silver"
                        onChange={(e) => update({ color: e.target.value || undefined })}
                      />
                    </label>
                    <label>
                      Model
                      <input
                        type="text"
                        value={filters.model ?? ""}
                        placeholder="e.g. Camry"
                        onChange={(e) => update({ model: e.target.value || undefined })}
                      />
                    </label>
                    <label>
                      Item
                      <input
                        type="text"
                        value={filters.item ?? ""}
                        placeholder="e.g. backpack"
                        onChange={(e) => update({ item: e.target.value || undefined })}
                      />
                    </label>
                  </div>
                </div>

              </div>

              {/* ── Footer: Clear filters anchored bottom-right ──────── */}
              <div className="ev-filter-panel-footer">
                <button className="ev-filter-clear-btn" onClick={clear}>
                  Clear filters
                </button>
              </div>
            </div>
          )}

          {/* ── 3-column workspace ───────────────────────────────────── */}
          <div className="ev-workspace">

            {/* ── Center: grid / list ───────────────────────────────── */}
            <div className="ev-library">
              {/* Loading state */}
              {search.isLoading && (
                <div className="ev-empty"><span>Loading observations…</span></div>
              )}

              {/* Error state — distinct from empty; shows retry */}
              {search.error && !search.isLoading && (
                <div className="ev-empty">
                  <strong>Failed to load observations</strong>
                  <span>
                    <button onClick={() => void search.refetch()} className="text-brand-500 hover:underline">
                      Retry
                    </button>
                  </span>
                </div>
              )}

              {/*
               * Genuine empty state — successful API response with zero results.
               * Only rendered in non-demo mode (demo mode renders the demo grid
               * instead). Clearly distinct from Loading and Error states above.
               */}
              {!search.isLoading && !search.error && !isDemo && realObservations.length === 0 && (
                <div className="ev-empty">
                  <span>No observations found.</span>
                  {hasActiveFilters && (
                    <button onClick={clear} className="text-brand-500 hover:underline">
                      Clear filters
                    </button>
                  )}
                </div>
              )}

              {/* Grid view */}
              {!search.isLoading && !search.error && visibleObservations.length > 0 && viewMode === "grid" && (
                <div className="ev-grid">
                  {visibleObservations.map((o) => (
                    <ObservationCard
                      key={o.id}
                      observation={o}
                      selected={selected?.id === o.id}
                      onClick={() => handleCardClick(o)}
                    />
                  ))}
                </div>
              )}

              {/* List view — DataTable with responsive column visibility */}
              {!search.isLoading && !search.error && viewMode === "list" && (
                <ObservationTable
                  observations={visibleObservations}
                  selected={selected}
                  onSelect={handleCardClick}
                  isLoading={search.isLoading}
                  error={search.error}
                  onRetry={() => void search.refetch()}
                />
              )}

              {/* Cursor pagination — real data only; demo mode has no pages */}
              {!isDemo && meta && <CursorPagination meta={meta} onCursor={setCursor} />}
            </div>

            {/* ── Right: details drawer ─────────────────────────────── */}
            {/* Backdrop — shown on mobile (≤860px) when a record is selected */}
            {selected && (
              <div className="ev-drawer-overlay" onClick={closeDrawer} aria-hidden="true" />
            )}
            <ObservationDetailsDrawer
              observation={selected}
              onClose={closeDrawer}
              onViewCustody={setCustodyTarget}
            />
          </div>
        </>
      )}

      {tab === "collections" && <CollectionsTab />}
      {tab === "exports" && <ExportsTab />}
      {tab === "retention" && <RetentionPolicyPanel />}
      {tab === "audit" && <EvidenceAuditTab />}

      <CustodyModal observation={custodyTarget} onClose={() => setCustodyTarget(null)} />
    </>
  );
}
