import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useCameraFeeds } from "../hooks/useCameraFeeds";
import { useRecentDetections } from "../hooks/useRecentDetections";
import { useEvidenceSearch } from "../../evidence/hooks/useEvidence";
import { useAuthenticatedImage } from "../../../hooks/useAuthenticatedImage";
import type { CameraSource } from "../api/camera-feeds.types";
import type { Observation } from "../../evidence/api/evidence.types";
import type { DetectionEvent } from "../api/detections.types";
import "../styles/camera-viewer.css";

// ─────────────────────────────────────────────────────────────────────────────
// Media item union
// ─────────────────────────────────────────────────────────────────────────────

type MediaItem =
  | { kind: "live"; sourceId: string }
  | { kind: "snapshot"; obs: Observation }
  | { kind: "clip"; obs: Observation };

function mediaItemId(m: MediaItem): string {
  if (m.kind === "live") return "live";
  return m.kind === "clip"
    ? `clip-${m.obs.id}`
    : `snap-${m.obs.id}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function LiveFrameViewer({ source }: { source: CameraSource }) {
  const { src, status } = useAuthenticatedImage(
    source.last_frame_url ?? null,
    source.last_frame_at ?? null,
  );

  const feedStatus = source.feed_status ?? "no_feed";

  return (
    <div className="cv-media-wrap">
      {status === "loading" && (
        <div className="cv-media-placeholder">Loading live frame…</div>
      )}
      {status === "error" && (
        <div className="cv-media-placeholder">Live frame unavailable</div>
      )}
      {status === "loaded" && src && (
        <img className="cv-media-img" src={src} alt={`Live feed — ${source.label}`} />
      )}

      <span className="cv-overlay-ts">{new Date().toLocaleString()}</span>

      {/* Camera name — top-right, live dot after name for live feeds */}
      <span className="cv-overlay-label">
        {source.label}
        {feedStatus === "live" && <span className="cv-live-dot" />}
      </span>
    </div>
  );
}

function SnapshotViewer({
  obs,
  label,
}: {
  obs: Observation;
  label: string;
}) {
  return (
    <div className="cv-media-wrap">
      <img
        className="cv-media-img"
        src={obs.snapshot_url ?? ""}
        alt={obs.label ?? "Observation snapshot"}
      />
      <span className="cv-overlay-ts">
        {obs.observed_at
          ? new Date(obs.observed_at).toLocaleString()
          : "–"}
      </span>
      <span className="cv-overlay-label">{label}</span>
    </div>
  );
}

function ClipViewer({
  obs,
  label,
}: {
  obs: Observation;
  label: string;
}) {
  return (
    <div className="cv-media-wrap">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        className="cv-media-video"
        src={obs.clip_url ?? ""}
        controls
        autoPlay
      />
      <span className="cv-overlay-ts">
        {obs.observed_at
          ? new Date(obs.observed_at).toLocaleString()
          : "–"}
      </span>
      <span className="cv-overlay-label">{label}</span>
    </div>
  );
}

// ── Details tab ───────────────────────────────────────────────────────────────

function DetailsTab({
  source,
  onViewSource,
}: {
  source: CameraSource;
  onViewSource: () => void;
}) {
  const health = source.health_score ?? null;
  const feedStatus = source.feed_status ?? "no_feed";

  return (
    <div>
      <p className="cv-section-title" style={{marginTop:0,marginBottom:"0.75rem"}}>Event Information</p>
      <div className="cv-kv-list">
        {/* Camera */}
        <div className="cv-kv-row">
          <svg className="cv-kv-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-label="Camera"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          <span className="cv-kv-val">{source.label}</span>
        </div>
        {/* Type */}
        <div className="cv-kv-row">
          <svg className="cv-kv-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-label="Type"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          <span className="cv-kv-val">{source.type}</span>
        </div>
        {/* Site */}
        <div className="cv-kv-row">
          <svg className="cv-kv-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-label="Site"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span className="cv-kv-val">{source.site ?? "–"}</span>
        </div>
        {/* Zone */}
        <div className="cv-kv-row">
          <svg className="cv-kv-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-label="Zone"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
          <span className="cv-kv-val">{source.zone ?? "–"}</span>
        </div>
        {/* Status */}
        <div className="cv-kv-row">
          <svg className="cv-kv-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-label="Status"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span className={`cv-sev cv-sev--${feedStatus === "live" ? "low" : feedStatus === "stale" ? "medium" : "critical"}`} style={{textTransform:"uppercase",fontSize:"0.6875rem",fontWeight:700}}>
            {feedStatus}
          </span>
        </div>
        {/* Health */}
        {health !== null && (
          <div className="cv-kv-row">
            <svg className="cv-kv-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-label="Health"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <div className="cv-health-bar-wrap">
              <div className="cv-health-bar">
                <div className="cv-health-fill" style={{width:`${Math.min(100, Math.round(health))}%`,background:health>70?"#22c55e":health>40?"#f59e0b":"#ef4444"}}/>
              </div>
              <span className="cv-health-pct">{Math.min(100, Math.round(health))}%</span>
            </div>
          </div>
        )}
        {/* Last frame */}
        {source.last_frame_at && (
          <div className="cv-kv-row">
            <svg className="cv-kv-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-label="Last frame"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span className="cv-kv-val">{new Date(source.last_frame_at).toLocaleString()}</span>
          </div>
        )}
      </div>

      {Array.isArray(source.tags) && source.tags.length > 0 && (
        <>
          <div className="cv-divider" />
          <p className="cv-section-title">Tags</p>
          <div className="cv-tags">
            {(source.tags as string[]).map((t) => (
              <span key={t} className="cv-tag">
                {t}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="cv-divider" />

      <button className="cv-view-source-btn" onClick={onViewSource}>
        ↗ View Camera Source
      </button>
    </div>
  );
}

// ── Analysis tab ──────────────────────────────────────────────────────────────

function AnalysisTab({ detections }: { detections: DetectionEvent[] }) {
  if (detections.length === 0) {
    return (
      <div className="cv-empty">
        <span>No recent detections</span>
      </div>
    );
  }

  return (
    <div>
      <p className="cv-section-title">Recent detections</p>
      {detections.map((d) => (
        <div key={d.id} className="cv-detection-row">
          <div className="cv-detection-top">
            <span className="cv-detection-type">{d.type}</span>
            <span className={`cv-sev cv-sev--${d.severity}`}>{d.severity}</span>
          </div>
          <span className="cv-detection-summary">
            {d.summary ?? "–"}
          </span>
          <span className="cv-detection-summary">
            {d.received_at ? new Date(d.received_at).toLocaleString() : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Related events tab ─────────────────────────────────────────────────────────

function RelatedEventsTab({ detections }: { detections: DetectionEvent[] }) {
  const navigate = useNavigate();
  const triggered = detections.filter((d) => d.triggered && d.incident_id);

  if (triggered.length === 0) {
    return (
      <div className="cv-empty">
        <span>No triggered incidents from this camera</span>
      </div>
    );
  }

  return (
    <div>
      <p className="cv-section-title">Triggered incidents</p>
      {triggered.map((d) => (
        <div key={d.id} className="cv-detection-row">
          <div className="cv-detection-top">
            <span className="cv-detection-type">{d.type}</span>
            <span className={`cv-sev cv-sev--${d.severity}`}>{d.severity}</span>
          </div>
          {d.summary && (
            <span className="cv-detection-summary">{d.summary}</span>
          )}
          {d.incident_id && (
            <button
              className="cv-incident-link"
              onClick={() => navigate(`/incidents/${d.incident_id}`)}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              → Incident #{d.incident_id.slice(0, 8)}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Snapshots tab ─────────────────────────────────────────────────────────────

function SnapshotsTab({
  observations,
  selectedId,
  onSelect,
}: {
  observations: Observation[];
  selectedId: string;
  onSelect: (m: MediaItem) => void;
}) {
  const snaps = observations.filter((o) => o.snapshot_url);

  if (snaps.length === 0) {
    return (
      <div className="cv-empty">
        <span>No snapshots recorded for this camera</span>
      </div>
    );
  }

  return (
    <div>
      <p className="cv-section-title">{snaps.length} snapshot{snaps.length !== 1 ? "s" : ""}</p>
      <div className="cv-snap-grid">
        {snaps.map((o) => {
          const m: MediaItem = { kind: "snapshot", obs: o };
          const id = mediaItemId(m);
          return (
            <div
              key={o.id}
              className={`cv-snap-thumb ${selectedId === id ? "cv-snap-thumb--selected" : ""}`}
              onClick={() => onSelect(m)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelect(m)}
              aria-label={`View snapshot: ${o.label ?? o.kind}`}
            >
              <img src={o.snapshot_url ?? ""} alt={o.label ?? o.kind} />
              <span className="cv-snap-kind-badge">{o.kind}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Carousel ──────────────────────────────────────────────────────────────────

const DESKTOP_IPP = 8; // items visible at once on desktop
const MOBILE_IPP  = 3; // items visible at once on mobile

/** Returns how many carousel items fit on screen, reactive to resize. */
function useItemsPerPage(): number {
  const [ipp, setIpp] = useState<number>(
    () => (typeof window !== "undefined" && window.innerWidth < 768 ? MOBILE_IPP : DESKTOP_IPP)
  );
  useEffect(() => {
    const h = () => setIpp(window.innerWidth < 768 ? MOBILE_IPP : DESKTOP_IPP);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return ipp;
}

function Carousel({
  items,
  selectedId,
  onSelect,
}: {
  items: MediaItem[];
  selectedId: string;
  onSelect: (m: MediaItem) => void;
}) {
  const selectedIndex = items.findIndex((m) => mediaItemId(m) === selectedId);
  const selectedItem  = items[selectedIndex];
  const itemsPerPage  = useItemsPerPage();

  // Windowed page start — auto-follow selected item
  const [windowStart, setWindowStart] = useState(0);
  useEffect(() => {
    if (selectedIndex < windowStart) {
      setWindowStart(selectedIndex);
    } else if (selectedIndex >= windowStart + itemsPerPage) {
      setWindowStart(Math.max(0, selectedIndex - itemsPerPage + 1));
    }
  }, [selectedIndex, windowStart, itemsPerPage]);

  const maxStart    = Math.max(0, items.length - itemsPerPage);
  const canSlidePrev = windowStart > 0;
  const canSlideNext = windowStart < maxStart;

  const slidePrev = () => setWindowStart((w) => Math.max(0, w - 1));
  const slideNext = () => setWindowStart((w) => Math.min(maxStart, w + 1));

  // Slice — only render the visible window (no overflow scroll)
  const visibleItems = items.slice(windowStart, windowStart + itemsPerPage);

  // Date label derived from selected observation (or "Today" for live)
  const dateLabel = (() => {
    if (!selectedItem || selectedItem.kind === "live") return "Today";
    const d = selectedItem.obs.observed_at ? new Date(selectedItem.obs.observed_at) : null;
    if (!d) return "Today";
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  })();

  return (
    <div className="cv-carousel-section">
      {/* ── Date / nav / LIVE row ── */}
      <div className="cv-carousel-date-row">
        {/* Calendar icon + date */}
        <span className="cv-carousel-date">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flexShrink:0}}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {dateLabel}
        </span>

        {/* Slide prev / next + LIVE pill — all flush right */}
        <div className="cv-carousel-controls-right">
          <button className="cv-carousel-nav" onClick={slidePrev} disabled={!canSlidePrev} aria-label="Slide left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15.25 6L9 12.25L15.25 18.5"/>
            </svg>
          </button>
          <button className="cv-carousel-nav" onClick={slideNext} disabled={!canSlideNext} aria-label="Slide right">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8.75 19L15 12.75L8.75 6.5"/>
            </svg>
          </button>
          <span className="cv-live-pill">
            <span className="cv-live-pill-dot" />
            LIVE
          </span>
        </div>
      </div>

      {/* ── Thumbnail strip — fixed count, no scroll ── */}
      <div className="cv-carousel-scroll">
        {visibleItems.map((m) => {
          const id     = mediaItemId(m);
          const active = id === selectedId;
          const ts =
            m.kind !== "live" && m.obs.observed_at
              ? new Date(m.obs.observed_at).toLocaleTimeString(undefined, {
                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                })
              : null;
          const prettyKind = m.kind !== "live"
            ? (m.obs.label ?? m.obs.kind.replace(/_/g, " ").replace(/\w/g, (c) => c.toUpperCase()))
            : null;
          const kindLabel =
            m.kind === "live"     ? "Live Feed"
            : m.kind === "clip"   ? (prettyKind ?? "Video Clip") + " · Video"
            : (prettyKind ?? "Snapshot") + " · Image";

          return (
            <button
              key={id}
              type="button"
              className={`cv-carousel-item${active ? " cv-carousel-item--active" : ""}`}
              onClick={() => onSelect(m)}
              aria-label={kindLabel}
              aria-pressed={active}
            >
              {/* Thumbnail with overlays */}
              <div className="cv-carousel-thumb">
                {m.kind === "live" && (
                  <div className="cv-carousel-item-live">
                    <div className="cv-carousel-item-live-dot" />
                  </div>
                )}
                {m.kind === "snapshot" && m.obs.snapshot_url && (
                  <img src={m.obs.snapshot_url} alt="" loading="lazy" />
                )}
                {m.kind === "clip" && m.obs.clip_url && (
                  <video src={m.obs.clip_url} muted preload="metadata" style={{pointerEvents:"none"}} />
                )}
                {ts && <span className="cv-carousel-ts-overlay">{ts}</span>}
                <span className={`cv-carousel-type-badge${m.kind === "live" ? " cv-carousel-type-badge--live" : m.kind === "clip" ? " cv-carousel-type-badge--clip" : ""}`}>
                  {m.kind === "live" ? "LIVE" : m.kind === "clip" ? "VIDEO" : "IMG"}
                </span>
              </div>
              <span className="cv-carousel-item-kind">{kindLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "details" | "analysis" | "related" | "snapshots";

export default function CameraViewerPage() {
  const { sourceId = "" } = useParams<{ sourceId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>("details");

  // ── Data ────────────────────────────────────────────────────────────────
  const feedsQuery = useCameraFeeds({});
  const detectionsQuery = useRecentDetections({
    cameraSourceId: sourceId,
    limit: 50,
  });
  const evidenceQuery = useEvidenceSearch({
    camera_source_id: sourceId,
  });

  const source: CameraSource | null = useMemo(
    () =>
      feedsQuery.data?.data?.find((s) => s.id === sourceId) ?? null,
    [feedsQuery.data, sourceId],
  );

  const observations: Observation[] = useMemo(
    () => evidenceQuery.data?.data ?? [],
    [evidenceQuery.data],
  );

  const detections: DetectionEvent[] = useMemo(
    () => detectionsQuery.data?.data ?? [],
    [detectionsQuery.data],
  );

  // ── Media items ─────────────────────────────────────────────────────────
  const mediaItems: MediaItem[] = useMemo(() => {
    const live: MediaItem = { kind: "live", sourceId };
    const obs: MediaItem[] = observations.map((o) =>
      o.clip_url
        ? ({ kind: "clip", obs: o } as MediaItem)
        : ({ kind: "snapshot", obs: o } as MediaItem),
    );
    return [live, ...obs];
  }, [sourceId, observations]);

  // ── Selected media from URL param ────────────────────────────────────────
  const rawParam = searchParams.get("media") ?? "live";
  const selectedId = useMemo(() => {
    const found = mediaItems.find((m) => mediaItemId(m) === rawParam);
    return found ? rawParam : "live";
  }, [mediaItems, rawParam]);

  const selectedItem: MediaItem =
    mediaItems.find((m) => mediaItemId(m) === selectedId) ?? mediaItems[0];

  const handleSelectMedia = (m: MediaItem) => {
    const id = mediaItemId(m);
    if (id === "live") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ media: id }, { replace: true });
    }
  };

  // ── Navigation ──────────────────────────────────────────────────────────
  const handleBack = () => navigate("/vision-guard/live");
  const handleViewSource = () =>
    navigate(`/vision-guard/camera-sources?view=${sourceId}`);

  // ── Loading / not-found ─────────────────────────────────────────────────
  const isLoading = feedsQuery.isLoading;
  const notFound = !isLoading && !source;

  // Dynamic page title based on selected media
  const pageTitle =
    selectedItem?.kind === "clip"
      ? "Video Detection"
      : selectedItem?.kind === "snapshot"
      ? "Image Detection"
      : "Live Feed";

  // Shared header for loading/error states
  const PageHeader = ({ title }: { title: string }) => (
    <div className="cv-header">
      <h1 className="cv-page-title">{title}</h1>
      <nav className="cv-breadcrumb" aria-label="breadcrumb">
        <button className="cv-breadcrumb-link" onClick={handleBack}>
          Live Monitoring
        </button>
      </nav>
    </div>
  );

  if (isLoading) {
    return (
      <div className="cv-page">
        <PageHeader title="Loading…" />
        <div style={{ padding: "2rem", color: "var(--color-gray-500, #6b7280)", fontSize: "0.875rem" }}>
          Loading camera…
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="cv-page">
        <PageHeader title="Camera not found" />
        <div style={{ padding: "2rem", color: "var(--color-gray-500, #6b7280)", fontSize: "0.875rem" }}>
          Camera not found.
        </div>
      </div>
    );
  }

  return (
    <div className="cv-page">
      {/* Header: dynamic title left · breadcrumb right */}
      <div className="cv-header">
        <h1 className="cv-page-title">{pageTitle}</h1>
        <nav className="cv-breadcrumb" aria-label="breadcrumb">
          <button className="cv-breadcrumb-link" onClick={handleBack}>
            Live Monitoring
          </button>
          <span className="cv-breadcrumb-sep">/</span>
          <span className="cv-breadcrumb-current">{source!.label}</span>
        </nav>
      </div>

      {/* Body */}
      <div className="cv-body">
        {/* Left: media viewer only */}
        <div className="cv-media-col">
          {selectedItem?.kind === "live" && (
            <LiveFrameViewer source={source!} />
          )}
          {selectedItem?.kind === "snapshot" && (
            <SnapshotViewer obs={selectedItem.obs} label={source!.label} />
          )}
          {selectedItem?.kind === "clip" && (
            <ClipViewer obs={selectedItem.obs} label={source!.label} />
          )}
        </div>

        {/* Right: tabbed panel */}
        <div className="cv-panel">
          {/* Tabs */}
          <div className="cv-tabs">
            {(
              [
                ["details", "Details"],
                ["analysis", "Analysis"],
                ["related", "Related"],
                ["snapshots", "Snapshots"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                className={`cv-tab ${activeTab === id ? "cv-tab--active" : ""}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="cv-tab-content">
            {activeTab === "details" && (
              <DetailsTab source={source!} onViewSource={handleViewSource} />
            )}
            {activeTab === "analysis" && (
              <AnalysisTab detections={detections} />
            )}
            {activeTab === "related" && (
              <RelatedEventsTab detections={detections} />
            )}
            {activeTab === "snapshots" && (
              <SnapshotsTab
                observations={observations}
                selectedId={selectedId}
                onSelect={handleSelectMedia}
              />
            )}
          </div>
        </div>
      </div>

      {/* Carousel — full-width row beneath the two-column body */}
      <Carousel
        items={mediaItems}
        selectedId={selectedId}
        onSelect={handleSelectMedia}
      />
    </div>
  );
}
