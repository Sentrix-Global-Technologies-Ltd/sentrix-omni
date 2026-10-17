import { useState, useCallback } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Tabs from "../../../components/shared/Tabs";
import CursorPagination, { type CursorMeta } from "../../../components/ui/pagination/CursorPagination";
import { GridIcon, ListIcon } from "../../../icons";
import ObservationCard from "../components/ObservationCard";
import ObservationListRow from "../components/ObservationListRow";
import ObservationDetailsDrawer from "../components/ObservationDetailsDrawer";
import CollectionsTab from "../components/CollectionsTab";
import ExportsTab from "../components/ExportsTab";
import RetentionPolicyPanel from "../components/RetentionPolicyPanel";
import EvidenceAuditTab from "../components/EvidenceAuditTab";
import CustodyModal from "../components/CustodyModal";
import { useEvidenceSearch, useEvidenceStats } from "../hooks/useEvidence";
import { KIND_OPTIONS, SEVERITY_OPTIONS, STATUS_OPTIONS } from "../components/evidenceTone";
import type { EvidenceFilters, Observation } from "../api/evidence.types";
import "../styles/evidence-console.css";

/* ─── Demo observations ────────────────────────────────────────────────────── */
const DEMO_OBSERVATIONS: Observation[] = [
  {
    id: "demo-1",
    organization_id: "demo",
    camera_source_id: null,
    kind: "vehicle",
    label: "Parking Lot – Camera 07",
    attributes: {
      media_type: "video",
      duration: "01:24",
      location_name: "North Entrance",
      camera_name: "Camera 07",
      incident_id: "INC-2024-0891",
      site_name: "Building A",
      file_size: "48.7 MB",
      resolution: "1920 × 1080",
      evidence_id: "EVD-2024-0891-0001",
      retention_days: 89,
      custody: [
        { event: "Captured", actor: "System (Camera 07)", time: "2024-05-22T09:14:00Z", type: "capture" },
        { event: "Transferred", actor: "System to Vault", time: "2024-05-22T09:15:00Z", type: "transfer" },
        { event: "Accessed", actor: "Admin User", time: "2024-05-22T10:02:00Z", type: "access" },
        { event: "Shared", actor: "Shared with 2 users", time: "2024-05-22T11:18:00Z", type: "share" },
        { event: "Exported", actor: "Exported by Admin User", time: "2024-05-22T11:45:00Z", type: "export" },
      ],
    },
    plate: null,
    confidence: null,
    severity: null,
    snapshot_url: "https://picsum.photos/seed/ev1/640/400",
    clip_url: "#demo",
    lat: null,
    lng: null,
    observed_at: "2024-05-22T09:14:00Z",
    hold: false,
    bookmarked: false,
    sealed: false,
    retention_tier: "hot",
    created_at: "2024-05-22T09:14:00Z",
  },
  {
    id: "demo-2",
    organization_id: "demo",
    camera_source_id: null,
    kind: "face",
    label: "Perimeter Breach – Shot 12",
    attributes: {
      media_type: "snapshot",
      location_name: "North Gate",
      camera_name: "Camera 03",
      incident_id: "INC-2024-0891",
      site_name: "Building A",
      file_size: "2.3 MB",
      resolution: "1920 × 1080",
      evidence_id: "EVD-2024-0891-0002",
      retention_days: 89,
      custody: [
        { event: "Captured", actor: "System (Camera 03)", time: "2024-05-22T09:12:00Z", type: "capture" },
        { event: "Transferred", actor: "System to Vault", time: "2024-05-22T09:12:30Z", type: "transfer" },
      ],
    },
    plate: null,
    confidence: null,
    severity: null,
    snapshot_url: "https://picsum.photos/seed/ev2/640/400",
    clip_url: null,
    lat: null,
    lng: null,
    observed_at: "2024-05-22T09:12:00Z",
    hold: false,
    bookmarked: false,
    sealed: false,
    retention_tier: "hot",
    created_at: "2024-05-22T09:12:00Z",
  },
  {
    id: "demo-3",
    organization_id: "demo",
    camera_source_id: null,
    kind: "vehicle",
    label: "Loading Dock – Camera 02",
    attributes: {
      media_type: "video",
      duration: "03:46",
      location_name: "Loading Bay A",
      camera_name: "Camera 02",
      incident_id: "INC-2024-0887",
      site_name: "Building A",
      file_size: "112.4 MB",
      resolution: "1920 × 1080",
      evidence_id: "EVD-2024-0887-0001",
      retention_days: 89,
    },
    plate: null,
    confidence: null,
    severity: null,
    snapshot_url: "https://picsum.photos/seed/ev3/640/400",
    clip_url: "#demo",
    lat: null,
    lng: null,
    observed_at: "2024-05-21T23:47:00Z",
    hold: false,
    bookmarked: false,
    sealed: false,
    retention_tier: "hot",
    created_at: "2024-05-21T23:47:00Z",
  },
  {
    id: "demo-4",
    organization_id: "demo",
    camera_source_id: null,
    kind: "scene",
    label: "Lobby – Camera 01",
    attributes: {
      media_type: "snapshot",
      location_name: "Main Lobby",
      camera_name: "Camera 01",
      incident_id: "INC-2024-0883",
      site_name: "Building A",
      file_size: "1.8 MB",
      resolution: "1920 × 1080",
      evidence_id: "EVD-2024-0883-0001",
      retention_days: 87,
    },
    plate: null,
    confidence: null,
    severity: null,
    snapshot_url: "https://picsum.photos/seed/ev4/640/400",
    clip_url: null,
    lat: null,
    lng: null,
    observed_at: "2024-05-21T15:21:00Z",
    hold: false,
    bookmarked: false,
    sealed: false,
    retention_tier: "hot",
    created_at: "2024-05-21T15:21:00Z",
  },
  {
    id: "demo-5",
    organization_id: "demo",
    camera_source_id: null,
    kind: "behavior",
    label: "South Entrance – Camera 05",
    attributes: {
      media_type: "video",
      duration: "02:15",
      location_name: "South Gate",
      camera_name: "Camera 05",
      incident_id: "INC-2024-0881",
      site_name: "Building B",
      file_size: "67.2 MB",
      resolution: "1280 × 720",
      evidence_id: "EVD-2024-0881-0001",
      retention_days: 12,
    },
    plate: null,
    confidence: null,
    severity: null,
    snapshot_url: "https://picsum.photos/seed/ev5/640/400",
    clip_url: "#demo",
    lat: null,
    lng: null,
    observed_at: "2024-05-21T08:03:00Z",
    hold: false,
    bookmarked: false,
    sealed: false,
    retention_tier: "warm",
    created_at: "2024-05-21T08:03:00Z",
  },
  {
    id: "demo-6",
    organization_id: "demo",
    camera_source_id: null,
    kind: "plate",
    label: "Vehicle Capture – Front",
    attributes: {
      media_type: "snapshot",
      location_name: "Parking Lot",
      camera_name: "LPR Camera 01",
      incident_id: "INC-2024-0879",
      site_name: "Building A",
      file_size: "1.4 MB",
      resolution: "1920 × 1080",
      evidence_id: "EVD-2024-0879-0001",
      retention_days: 11,
    },
    plate: "ABC-1234",
    confidence: null,
    severity: null,
    snapshot_url: "https://picsum.photos/seed/ev6/640/400",
    clip_url: null,
    lat: null,
    lng: null,
    observed_at: "2024-05-20T20:45:00Z",
    hold: false,
    bookmarked: false,
    sealed: false,
    retention_tier: "warm",
    created_at: "2024-05-20T20:45:00Z",
  },
];

/* ─── Sidebar config ───────────────────────────────────────────────────────── */
const SIDEBAR_CATEGORIES = [
  { value: "", label: "All Evidence" },
  { value: "vehicle", label: "Video Clips" },
  { value: "face", label: "Snapshots" },
  { value: "behavior", label: "Audio Recordings" },
  { value: "scene", label: "Incident Exports" },
];

const SIDEBAR_FOLDERS = [
  {
    label: "Global Operations",
    children: [
      { label: "North Region", count: 456 },
      { label: "South Region", count: 312 },
      { label: "East Region", count: 198 },
      { label: "West Region", count: 164 },
    ],
  },
  { label: "Corporate HQ", count: 68 },
  { label: "External Shares", count: 50 },
  { label: "Archived", count: 0 },
];

const TABS = [
  { key: "observations", label: "Observations" },
  { key: "collections", label: "Collections" },
  { key: "exports", label: "Exports" },
  { key: "retention", label: "Retention Policy" },
  { key: "audit", label: "Audit Log" },
];

/* ─── Inline SVG helpers ───────────────────────────────────────────────────── */
function SearchSVG() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function FilterSVG() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
function SortSVG() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="8" y2="18" />
    </svg>
  );
}
function ChevronSVG({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function FolderSVG() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function EvidenceConsolePage() {
  const [tab, setTab] = useState("observations");
  const [filters, setFilters] = useState<EvidenceFilters>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Observation | null>(null);
  const [custodyTarget, setCustodyTarget] = useState<Observation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState("newest");
  const [foldersOpen, setFoldersOpen] = useState(true);

  const stats = useEvidenceStats();
  const search = useEvidenceSearch(filters);

  const s = stats.data?.data;
  const realObservations = search.data?.data ?? [];
  const meta = search.data?.meta as CursorMeta | undefined;

  const isDemo = !search.isLoading && realObservations.length === 0;
  const displayObservations = isDemo ? DEMO_OBSERVATIONS : realObservations;

  const update = useCallback((next: Partial<EvidenceFilters>) =>
    setFilters((f) => ({ ...f, ...next, cursor: undefined })), []);
  const clear = useCallback(() => setFilters({}), []);
  const setCursor = useCallback((cursor: string | null) =>
    setFilters((f) => ({ ...f, cursor: cursor ?? undefined })), []);

  const handleCardClick = useCallback((o: Observation) => {
    setSelected((prev) => prev?.id === o.id ? null : o);
  }, []);

  const closeDrawer = useCallback(() => setSelected(null), []);

  /* Demo counts */
  const demoCounts: Record<string, number> = {
    "": 6,
    vehicle: 2,
    face: 1,
    behavior: 1,
    scene: 1,
    plate: 1,
  };

  return (
    <>
      <PageMeta title="Evidence | Sentrix Console" description="Evidence vault and observations" />
      <PageHeader title="Evidence Vault" breadcrumbs={[{ label: "Vision Guard" }, { label: "Evidence Vault" }]} />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── Observations tab ─────────────────────────────────────────── */}
      {tab === "observations" && (
        <>
          {/* Demo banner */}
          {isDemo && (
            <div className="ev-demo-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Demo content — connect to your API to see real evidence
            </div>
          )}

          {/* ── Toolbar row ──────────────────────────────────────────── */}
          <div className="ev-toolbar-row">
            <div className="ev-search-group">
              <div className="ev-search-input-wrap">
                <SearchSVG />
                <input
                  type="text"
                  value={filters.q ?? ""}
                  onChange={(e) => update({ q: e.target.value || undefined })}
                  placeholder="Search evidence by keyword, ID, or location…"
                />
              </div>
              <button
                className={`ev-filters-btn${showFilters ? " active" : ""}`}
                onClick={() => setShowFilters((v) => !v)}
              >
                <FilterSVG />
                Filters
              </button>
            </div>

            <div className="ev-sort-group">
              <div className="ev-sort-select-wrap">
                <SortSVG />
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="size">Largest File</option>
                  <option value="severity">Highest Severity</option>
                </select>
              </div>
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
          </div>

          {/* ── Collapsible filter panel ─────────────────────────────── */}
          {showFilters && (
            <div className="ev-filter-panel">
              <div className="ev-filter-grid">
                <div className="ev-filter-field">
                  <label>Plate</label>
                  <input
                    type="text"
                    value={filters.plate ?? ""}
                    placeholder="e.g. ABC123"
                    onChange={(e) => update({ plate: e.target.value || undefined })}
                  />
                </div>
                <div className="ev-filter-field">
                  <label>Kind</label>
                  <select value={filters.kind ?? ""} onChange={(e) => update({ kind: (e.target.value as EvidenceFilters["kind"]) || undefined })}>
                    <option value="">All kinds</option>
                    {KIND_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="ev-filter-field">
                  <label>Severity</label>
                  <select value={filters.severity ?? ""} onChange={(e) => update({ severity: (e.target.value as EvidenceFilters["severity"]) || undefined })}>
                    <option value="">All severities</option>
                    {SEVERITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="ev-filter-field">
                  <label>Status</label>
                  <select value={filters.status ?? ""} onChange={(e) => update({ status: (e.target.value as EvidenceFilters["status"]) || undefined })}>
                    <option value="">Any</option>
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="ev-filter-clear" onClick={clear}>Clear filters</button>
            </div>
          )}

          {/* ── 3-column workspace ───────────────────────────────────── */}
          <div className="ev-workspace">

            {/* ── Left sidebar ─────────────────────────────────────── */}
            <div className="ev-sidebar-wrap">
              <aside className="ev-sidebar">

                {/* Categories */}
                <div className="ev-sidebar-section">
                  <div className="ev-sidebar-heading">Categories</div>
                  <div className="ev-category-list">
                    {SIDEBAR_CATEGORIES.map(({ value, label }) => {
                      const byKind = s?.by_kind ?? {};
                      const count = isDemo
                        ? (demoCounts[value] ?? 0)
                        : value
                        ? (byKind[value] ?? 0)
                        : (s?.total ?? 0);
                      return (
                        <button
                          key={value}
                          className={`ev-category-btn${(filters.kind ?? "") === value ? " active" : ""}`}
                          onClick={() => update({ kind: value as EvidenceFilters["kind"] || undefined })}
                        >
                          <span className="ev-category-icon">
                            {value === "" && (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                              </svg>
                            )}
                            {value === "vehicle" && (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="23 7 16 7 12 3 8 7 1 7 1 17 23 17 23 7" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
                              </svg>
                            )}
                            {value === "face" && (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                              </svg>
                            )}
                            {value === "behavior" && (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                              </svg>
                            )}
                            {value === "scene" && (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                              </svg>
                            )}
                          </span>
                          {label}
                          <span className="ev-category-count">{count.toLocaleString()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Folders */}
                <div className="ev-sidebar-section">
                  <div className="ev-sidebar-heading" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    Folders
                    <button
                      className="ev-sidebar-add-btn"
                      aria-label="Add folder"
                      style={{ marginLeft: "auto" }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                  <div className="ev-folder-list">
                    {SIDEBAR_FOLDERS.map((folder) => (
                      <div key={folder.label} className="ev-folder-item">
                        {folder.children ? (
                          <>
                            <button
                              className="ev-category-btn"
                              style={{ paddingLeft: 6 }}
                              onClick={() => setFoldersOpen((v) => !v)}
                            >
                              <span className="ev-folder-chevron">
                                <ChevronSVG open={foldersOpen} />
                              </span>
                              <span className="ev-folder-icon"><FolderSVG /></span>
                              {folder.label}
                              <span className="ev-folder-count">
                                {folder.children.reduce((a, c) => a + c.count, 0).toLocaleString()}
                              </span>
                            </button>
                            {foldersOpen && (
                              <div className="ev-folder-children">
                                {folder.children.map((child) => (
                                  <button key={child.label} className="ev-category-btn" style={{ paddingLeft: 28 }}>
                                    <span className="ev-folder-icon"><FolderSVG /></span>
                                    {child.label}
                                    <span className="ev-folder-count">{child.count.toLocaleString()}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <button className="ev-category-btn">
                            <span className="ev-folder-icon"><FolderSVG /></span>
                            {folder.label}
                            {"count" in folder && (
                              <span className="ev-folder-count">{(folder.count as number).toLocaleString()}</span>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage card */}
                <div className="ev-storage-card">
                  <div className="ev-storage-card-head">
                    <span>Storage Used</span>
                    <span className="ev-storage-pct">23%</span>
                  </div>
                  <div className="ev-storage-bar-track">
                    <div className="ev-storage-bar-fill" style={{ width: "23%" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ev-muted)", marginTop: 4 }}>
                    2.34 TB of 10 TB used
                  </div>
                </div>
              </aside>
            </div>

            {/* ── Center: grid / list ───────────────────────────────── */}
            <div className="ev-library">
              {/* Count bar */}
              <div className="ev-count-bar">
                <span>
                  {search.isLoading
                    ? "Loading…"
                    : `${displayObservations.length.toLocaleString()} item${displayObservations.length === 1 ? "" : "s"}`}
                </span>
                <span className="ev-count-sep">|</span>
                <span>0 selected</span>
                <span className="ev-count-sep">|</span>
                <button className="ev-count-action">Select All</button>
                <button className="ev-count-more">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                  </svg>
                </button>
              </div>

              {/* Loading */}
              {search.isLoading && (
                <div className="ev-empty"><span>Loading observations…</span></div>
              )}

              {/* Error */}
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

              {/* Grid view */}
              {!search.isLoading && displayObservations.length > 0 && viewMode === "grid" && (
                <div className="ev-grid">
                  {displayObservations.map((o) => (
                    <ObservationCard
                      key={o.id}
                      observation={o}
                      selected={selected?.id === o.id}
                      onClick={() => handleCardClick(o)}
                    />
                  ))}
                </div>
              )}

              {/* List view */}
              {!search.isLoading && displayObservations.length > 0 && viewMode === "list" && (
                <div className="ev-list">
                  <div className="ev-list-head">
                    <span />
                    <span>Observation</span>
                    <span>Kind</span>
                    <span className="ev-list-col-severity">Severity</span>
                    <span>Observed</span>
                    <span>Flags</span>
                  </div>
                  {displayObservations.map((o) => (
                    <ObservationListRow
                      key={o.id}
                      observation={o}
                      selected={selected?.id === o.id}
                      onClick={() => handleCardClick(o)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination (real data only) */}
              {!isDemo && <CursorPagination meta={meta} onCursor={setCursor} />}
            </div>

            {/* ── Right: details drawer ─────────────────────────────── */}
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
