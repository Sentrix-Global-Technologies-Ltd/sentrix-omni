import { useState, useRef, useEffect } from "react";
import { CloseIcon, FileIcon } from "../../../icons";
import { relativeTime, titleCase, formatDateTime } from "./evidenceTone";
import ObservationActions from "./ObservationActions";
import { useAuditLogs } from "../../audit/hooks/useAuditLogs";
import { useEvidenceCollections } from "../hooks/useEvidence";
import { useEvidenceCollectionActions } from "../hooks/useEvidenceActions";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import type { Observation, EvidenceCollection } from "../api/evidence.types";
import Can from "../../../components/shared/Can";
import "../styles/evidence-console.css";

interface Props {
  observation: Observation | null;
  onClose: () => void;
  onViewCustody: (o: Observation) => void;
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="ev-meta-row">
      <span className="ev-meta-dt">{label}</span>
      <span className="ev-meta-dd">{value}</span>
    </div>
  );
}

/* ── Custody event icons ─────────────────────────────────────────── */
function CustodyIcon({ type }: { type?: string }) {
  switch (type) {
    case "capture":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      );
    case "transfer":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />
        </svg>
      );
    case "access":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "share":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "export":
    default:
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <polyline points="9 15 12 18 15 15" />
        </svg>
      );
  }
}

/* ── Empty placeholder ───────────────────────────────────────────── */
function EmptyDrawer() {
  return (
    <aside className="ev-drawer ev-drawer--empty" aria-label="Evidence Details">
      <div className="ev-drawer-header">
        <h2>Evidence Details</h2>
      </div>
      <div className="ev-drawer-empty">
        <FileIcon className="size-8 opacity-30" />
        <strong>No evidence selected</strong>
        <span>Click a card to view its details.</span>
      </div>
    </aside>
  );
}

export default function ObservationDetailsDrawer({ observation: o, onClose, onViewCustody }: Props) {
  const [showExport, setShowExport] = useState(false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [collectionSearch, setCollectionSearch] = useState("");
  const exportRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const collectionsQuery = useEvidenceCollections(1);
  const { addObservations } = useEvidenceCollectionActions();

  // Close export panel on outside click
  useEffect(() => {
    if (!showExport) return;
    function handler(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showExport]);

  const logs = useAuditLogs({
    subject_type: "observation",
    subject_id: o?.id,
  });

  if (!o) return <EmptyDrawer />;

  const attr = o.attributes as Record<string, unknown> ?? {};
  const label = o.label ?? titleCase(o.kind);
  const clipUrl = o.clip_url && o.clip_url !== "#demo" ? o.clip_url : null;
  const snapshotUrl = o.snapshot_url && o.snapshot_url !== "#demo" ? o.snapshot_url : null;

  const evidenceId = (attr.evidence_id as string | undefined) ?? o.id.slice(0, 8).toUpperCase();
  const incidentId = attr.incident_id as string | undefined;
  const locationName = attr.location_name as string | undefined;
  const cameraName = attr.camera_name as string | undefined;
  const siteName = attr.site_name as string | undefined;
  const duration = attr.duration as string | undefined;
  const fileSize = attr.file_size as string | undefined;
  const resolution = attr.resolution as string | undefined;
  const retentionDays = attr.retention_days as number | undefined;
  const custodyEvents = attr.custody as Array<{ event: string; actor: string; time: string; type?: string }> | undefined;

  // Determine format badges
  const hasVideo = Boolean(o.clip_url);
  const mediaKind = hasVideo ? "VIDEO CLIP" : "SNAPSHOT";
  const mediaBadge2 = hasVideo ? "MP4" : "JPG";

  // Camera display
  const cameraDisplay = locationName && cameraName
    ? `${locationName} • ${cameraName}`
    : o.camera_source_id
    ? `Camera ${o.camera_source_id.slice(0, 8)}`
    : "—";

  // Custody: demo uses embedded, real uses audit log
  const isDemo = o.organization_id === "demo" || o.id.startsWith("demo-");
  const custodyList = isDemo && custodyEvents
    ? custodyEvents
    : (logs.data?.data ?? []).slice(0, 10).map((entry) => ({
        event: entry.action,
        actor: entry.actor_name ?? "System",
        time: entry.created_at ?? "",
        type: undefined as string | undefined,
      }));

  // Retention status
  const retLow = retentionDays != null && retentionDays < 14;
  const retentionLabel = retentionDays != null
    ? `${retentionDays} days remaining`
    : titleCase(o.retention_tier);

  return (
    <aside className="ev-drawer" aria-label="Evidence Details">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="ev-drawer-header">
        <h2>Evidence Details</h2>
        <button className="ev-drawer-close" onClick={onClose} aria-label="Close details">
          <CloseIcon className="size-4" />
        </button>
      </div>

      {/* ── Scrollable body ────────────────────────────────────────── */}
      <div className="ev-drawer-scroll">

        {/* 16:9 media area */}
        <div className="ev-drawer-media">
          {clipUrl ? (
            <video controls src={clipUrl} poster={snapshotUrl ?? undefined}>
              Your browser does not support video playback.
            </video>
          ) : snapshotUrl ? (
            <img src={snapshotUrl} alt={label} />
          ) : (
            <div className="ev-drawer-media-placeholder">
              <FileIcon className="size-10 opacity-30" />
              <span>No media preview</span>
            </div>
          )}
        </div>

        {/* Title row: name + badges + icon actions */}
        <div className="ev-drawer-body">
          <div className="ev-drawer-title-row">
            <div className="ev-drawer-title-left">
              <h3 title={label}>{label}</h3>
              <div className="ev-drawer-badges">
                <span className="ev-drawer-badge type">{mediaKind}</span>
                <span className="ev-drawer-badge fmt">{mediaBadge2}</span>
                {o.hold && (
                  <span className="ev-drawer-badge" style={{ background: "#fef2f2", color: "#dc2626" }}>
                    Legal Hold
                  </span>
                )}
                {o.sealed && (
                  <span className="ev-drawer-badge" style={{ background: "#f5f0ff", color: "#7c3aed" }}>
                    Sealed
                  </span>
                )}
              </div>
            </div>

            <div className="ev-drawer-icon-actions">
              {(clipUrl || snapshotUrl) && (
                <a
                  href={clipUrl ?? snapshotUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="ev-drawer-icon-btn"
                  title="Download"
                >
                  {/* Download icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </a>
              )}
              <button className="ev-drawer-icon-btn" title="Chain of custody" onClick={() => onViewCustody(o)}>
                {/* Share icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
              <button className="ev-drawer-icon-btn" title="More options">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Metadata table ─────────────────────────────────────── */}
          <dl className="ev-meta-dl">
            <MetaRow label="Evidence ID" value={<span className="font-mono text-xs">{evidenceId}</span>} />
            {incidentId && (
              <MetaRow
                label="Incident"
                value={<span className="ev-meta-link">{incidentId}</span>}
              />
            )}
            <MetaRow label="Camera" value={cameraDisplay} />
            {siteName && <MetaRow label="Site" value={siteName} />}
            <MetaRow
              label="Date / Time"
              value={o.observed_at ? formatDateTime(o.observed_at) : "—"}
            />
            {duration && <MetaRow label="Duration" value={duration} />}
            {fileSize && <MetaRow label="File Size" value={fileSize} />}
            {resolution && <MetaRow label="Resolution" value={resolution} />}
            <MetaRow
              label="Retention Status"
              value={
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: retLow ? "#f59e0b" : "#16a34a" }}>
                  {retLow ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {retentionLabel}
                </span>
              }
            />
            {o.confidence != null && (
              <MetaRow label="Confidence" value={`${Math.round(o.confidence * 100)}%`} />
            )}
            {o.lat != null && o.lng != null && (
              <MetaRow label="Location" value={`${o.lat.toFixed(5)}, ${o.lng.toFixed(5)}`} />
            )}
          </dl>

          {/* ── ObservationActions (hold / bookmark) ─────────────── */}
          <Can permission="evidence.view">
            <div className="py-3 border-b border-gray-100 dark:border-gray-700">
              {isDemo ? (
                /*
                 * Demo records cannot be actioned — the hold/bookmark API
                 * endpoints reject demo-prefixed IDs. Show a clear notice
                 * instead of disabled buttons so the user understands why
                 * the actions are absent.
                 */
                <p className="text-xs text-right" style={{ color: "#9ca3af" }}>
                  Actions unavailable for demo records.
                </p>
              ) : (
                <ObservationActions observation={o} onViewCustody={onViewCustody} />
              )}
            </div>
          </Can>

          {/* ── Chain of Custody ───────────────────────────────────── */}
          <div className="ev-custody-section">
            <h3>Chain of Custody</h3>

            {!isDemo && logs.isLoading && (
              <div className="text-xs text-gray-400 py-4">Loading…</div>
            )}

            {custodyList.length === 0 && (
              <div className="text-xs text-gray-400 py-4">No custody events recorded yet.</div>
            )}

            {custodyList.length > 0 && (
              <div className="ev-custody-timeline">
                {custodyList.map((entry, i) => (
                  <div key={i} className="ev-custody-event">
                    <div className={`ev-custody-dot${i === custodyList.length - 1 ? " faded" : ""}`}>
                      <CustodyIcon type={entry.type} />
                    </div>
                    <div className="ev-custody-info">
                      <strong>{entry.event}</strong>
                      <small>{entry.actor}</small>
                      <small className="text-gray-400 dark:text-gray-500">
                        {entry.time ? relativeTime(entry.time) : ""}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer: export / share panel ───────────────────────────── */}
      <div className="ev-drawer-footer" ref={exportRef}>
        {showExport && o && (
          <div className="ev-export-sheet">
            {/* Download snapshot */}
            {(o.snapshot_url && o.snapshot_url !== "#demo") && (
              <a
                href={o.snapshot_url}
                download
                className="ev-export-sheet-item"
                onClick={() => setShowExport(false)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Snapshot
              </a>
            )}
            {/* Download clip */}
            {(o.clip_url && o.clip_url !== "#demo") && (
              <a
                href={o.clip_url}
                download
                className="ev-export-sheet-item"
                onClick={() => setShowExport(false)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 7 12 3 8 7 1 7 1 17 23 17 23 7" />
                  <polyline points="7 10 12 15 17 10" />
                </svg>
                Download Clip
              </a>
            )}
            {/* Copy evidence ID */}
            <button
              className="ev-export-sheet-item"
              onClick={() => {
                void navigator.clipboard.writeText(o.id).then(() => {
                  toast.success("Evidence ID copied.");
                  setShowExport(false);
                });
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy Evidence ID
            </button>
            {/* Add to collection — disabled for demo observations */}
            {!isDemo ? (
              <button
                className="ev-export-sheet-item"
                onClick={() => {
                  setShowCollectionPicker((v) => !v);
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
                Add to Collection
              </button>
            ) : (
              <span className="ev-export-sheet-item ev-export-sheet-item--disabled">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                Add to Collection (unavailable for demo)
              </span>
            )}
            {/* Inline collection picker */}
            {showCollectionPicker && !isDemo && (
              <div className="ev-collection-picker">
                <input
                  type="text"
                  placeholder="Search collections…"
                  value={collectionSearch}
                  onChange={(e) => setCollectionSearch(e.target.value)}
                  className="ev-collection-picker-input"
                  autoFocus
                />
                <div className="ev-collection-picker-list">
                  {collectionsQuery.isLoading && (
                    <span className="ev-collection-picker-empty">Loading…</span>
                  )}
                  {!collectionsQuery.isLoading && (collectionsQuery.data?.data ?? []).length === 0 && (
                    <span className="ev-collection-picker-empty">No collections yet.</span>
                  )}
                  {(collectionsQuery.data?.data ?? [])
                    .filter((c: EvidenceCollection) =>
                      !collectionSearch ||
                      c.name.toLowerCase().includes(collectionSearch.toLowerCase())
                    )
                    .map((c: EvidenceCollection) => (
                      <button
                        key={c.id}
                        className="ev-collection-picker-item"
                        onClick={async () => {
                          try {
                            await addObservations.mutateAsync({
                              id: c.id,
                              observationIds: [o.id],
                            });
                            toast.success(`Added to "${c.name}".`);
                            setShowCollectionPicker(false);
                            setShowExport(false);
                          } catch (err) {
                            toast.error(
                              err instanceof ApiError ? err.message : "Could not add to collection."
                            );
                          }
                        }}
                      >
                        {c.name}
                        {c.observations_count != null && (
                          <span className="ev-collection-picker-count">{c.observations_count}</span>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
        <button
          className={`ev-export-btn${showExport ? " active" : ""}`}
          onClick={() => {
            setShowExport((v) => !v);
            if (showExport) setShowCollectionPicker(false);
          }}
        >
          Export / Share Evidence
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: showExport ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
