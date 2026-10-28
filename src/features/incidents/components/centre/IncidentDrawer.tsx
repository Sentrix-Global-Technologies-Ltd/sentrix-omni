import { useState, useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router";
import { useOrganization } from "../../../../context/OrganizationContext";
import { useIncident } from "../../hooks/useIncident";
import { useIncidentActions } from "../../hooks/useIncidentActions";
import { useAuthenticatedImage } from "../../../../hooks/useAuthenticatedImage";
import { useToast } from "../../../../components/shared/toast";
import { env } from "../../../../config/env";
import Can from "../../../../components/shared/Can";
import ConfirmDialog from "../../../../components/shared/ConfirmDialog";
import type { Incident, TimelineEntry } from "../../api/incidents.types";
import { formatDateTime, titleCase } from "../incidentTone";

// ── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Incident["status"] }) {
  const labels: Record<Incident["status"], string> = {
    open: "Open",
    investigating: "Investigating",
    escalated: "Escalated",
    resolved: "Resolved",
    closed: "Closed",
  };
  return (
    <span className={`ic-status-pill ic-status--${status}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Evidence panel ────────────────────────────────────────────────────────────

function EvidencePanel({ incidentId }: { incidentId: string }) {
  const { activeId } = useOrganization();
  const captureUrl =
    activeId && incidentId
      ? `${env.apiBaseUrl}/organizations/${activeId}/incidents/${incidentId}/capture`
      : null;
  const { src, status } = useAuthenticatedImage(captureUrl);

  return (
    <div className="ic-evidence-area" aria-label="Detection evidence">
      {status === "loading" && (
        <div className="ic-evidence-placeholder">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>Loading frame…</span>
        </div>
      )}
      {status === "error" && (
        <div className="ic-evidence-placeholder">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>No capture available</span>
        </div>
      )}
      {src && status !== "error" && (
        <>
          <img src={src} alt="Still frame from detection camera" loading="lazy" />
          <span className="ic-evidence-label">Still frame · detection camera</span>
        </>
      )}
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function TimelinePanel({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="ic-timeline-empty">No timeline events yet.</p>
    );
  }
  return (
    <div className="ic-timeline">
      {entries.map((entry, idx) => {
        const isLast = idx === entries.length - 1;
        const dotClass =
          entry.type === "alert"           ? "ic-timeline-dot--alert"
          : entry.type?.includes("action") ? "ic-timeline-dot--action"
          : "ic-timeline-dot--system";

        return (
          <div className="ic-timeline-entry" key={`${entry.type}-${idx}`}>
            {/* Spine: dot + connecting line */}
            <div className="ic-timeline-spine">
              <div className={`ic-timeline-dot ${dotClass}`} />
              {!isLast && <div className="ic-timeline-line" />}
            </div>

            {/* Content: event name + date/time (right), then actor below */}
            <div className="ic-timeline-content">
              <div className="ic-timeline-main">
                <span className="ic-timeline-type">
                  {titleCase(entry.type.replace(/\./g, " "))}
                </span>
                {entry.at && (
                  <span className="ic-timeline-at">{formatDateTime(entry.at)}</span>
                )}
              </div>
              {entry.source && (
                <div className="ic-timeline-source">{entry.source}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const IconSite = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconUser = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconCamera = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);
const IconDesc = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IconNote = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
);
const IconChevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconAction = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);

// ── Detail metadata row ───────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
  multiLine = false,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  multiLine?: boolean;
}) {
  return (
    <div className={`ic-detail-row${multiLine ? " ic-detail-row--multi" : ""}`}>
      <div className="ic-detail-label-group">
        <span className="ic-detail-icon">{icon}</span>
        <span className="ic-detail-label">{label}</span>
      </div>
      <div className="ic-detail-val">{value}</div>
    </div>
  );
}

// ── Action type definitions ───────────────────────────────────────────────────

type ActionKey = "investigate" | "escalate" | "resolve" | "close" | "notify";

interface ActionConfig {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
  danger?: boolean;
}

const ACTION_CONFIGS: Record<ActionKey, ActionConfig> = {
  investigate: {
    label: "Start investigation",
    title: "Mark as Investigating",
    description: "Confirm that this incident is under active investigation.",
    confirmLabel: "Mark investigating",
  },
  escalate: {
    label: "Escalate",
    title: "Escalate Incident",
    description: "Escalate this incident to a higher level of urgency.",
    confirmLabel: "Escalate",
    tone: "danger",
    danger: true,
  },
  resolve: {
    label: "Mark resolved",
    title: "Resolve Incident",
    description: "Mark this incident as resolved. It will remain on record.",
    confirmLabel: "Resolve",
  },
  close: {
    label: "Close incident",
    title: "Close Incident",
    description: "Close this incident. It will be removed from active queues.",
    confirmLabel: "Close incident",
    tone: "danger",
    danger: true,
  },
  notify: {
    label: "Notify authorities",
    title: "Record Authority Contact",
    description: "Record that you personally contacted external authorities. No automated dispatch is triggered.",
    confirmLabel: "Record contact",
  },
};

// ── Main drawer ───────────────────────────────────────────────────────────────

interface IncidentDrawerProps {
  incidentId: string;
  onClose: () => void;
}

export default function IncidentDrawer({ incidentId, onClose }: IncidentDrawerProps): ReactNode {
  const query   = useIncident(incidentId);
  const actions = useIncidentActions(incidentId);
  const toast   = useToast();

  const detail   = query.data?.data;
  const incident = detail?.incident;
  const timeline = detail?.timeline ?? [];

  // Take Action dropdown
  const [takeActionOpen, setTakeActionOpen] = useState(false);
  const takeActionRef = useRef<HTMLDivElement>(null);

  // Pending confirm dialog
  const [pendingAction, setPendingAction] = useState<ActionKey | null>(null);
  const [submitting,    setSubmitting]    = useState(false);

  // Close drawer on Escape (only when no confirm dialog is open)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pendingAction) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, pendingAction]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!takeActionOpen) return;
    const handler = (e: MouseEvent) => {
      if (takeActionRef.current && !takeActionRef.current.contains(e.target as Node)) {
        setTakeActionOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [takeActionOpen]);

  const handleActionSelect = (key: ActionKey) => {
    setTakeActionOpen(false);
    setPendingAction(key);
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setSubmitting(true);
    try {
      if (pendingAction === "investigate") await actions.investigate.mutateAsync();
      else if (pendingAction === "escalate")  await actions.escalate.mutateAsync();
      else if (pendingAction === "resolve")   await actions.resolve.mutateAsync();
      else if (pendingAction === "close")     await actions.close.mutateAsync();
      else if (pendingAction === "notify")    await actions.notifyAuthorities.mutateAsync();
      toast.success("Action completed successfully.");
      setPendingAction(null);
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const s = incident?.status;
  const canInvestigate = s === "open";
  const canEscalate    = s === "open" || s === "investigating";
  const canResolve     = s !== "resolved" && s !== "closed";
  const canClose       = s !== "closed";
  const canNotify      = !incident?.authorities_notified_at;

  const cfg = pendingAction ? ACTION_CONFIGS[pendingAction] : null;

  const displayId = incident
    ? `INC-${incident.id.slice(0, 8).toUpperCase()}`
    : null;

  return (
    <>
      {/* Overlay */}
      <div className="ic-drawer-overlay" onClick={onClose} aria-hidden="true" />

      {/* Drawer panel */}
      <aside
        className="ic-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={incident ? `Incident: ${incident.title}` : "Incident details"}
      >
        {/* ── Header: Title | Status | × ──────────────────────────────────── */}
        <div className="ic-drawer-header">
          {incident ? (
            <>
              {/* Row 1: title + status pill + close button */}
              <div className="ic-drawer-hdr-title-row">
                <h2 className="ic-drawer-title">{incident.title}</h2>
                <div className="ic-drawer-hdr-actions">
                  <StatusPill status={incident.status} />
                  <button
                    type="button"
                    className="ic-drawer-close"
                    onClick={onClose}
                    aria-label="Close incident details"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
              {/* Row 2: Incident ID */}
              {displayId && (
                <div className="ic-drawer-inc-id">{displayId}</div>
              )}
            </>
          ) : (
            /* Loading state */
            <div className="ic-drawer-hdr-title-row">
              <h2 className="ic-drawer-title" style={{ color: "#9ca3af" }}>Loading…</h2>
              <div className="ic-drawer-hdr-actions">
                <button
                  type="button"
                  className="ic-drawer-close"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="ic-drawer-body">

          {query.isError && (
            <div className="ic-drawer-section">
              <p style={{ color: "#ef4444", fontSize: "0.8125rem" }}>
                Failed to load incident details.
              </p>
            </div>
          )}

          {incident && (
            <>
              {/* ── Metadata block ─────────────────────────────────────── */}
              <div className="ic-drawer-section ic-drawer-section--meta">
                <DetailRow icon={<IconSite />}   label="Site"        value={detail?.explanation?.camera?.site ?? "—"} />
                <DetailRow
                  icon={<IconClock />}
                  label="Detected"
                  value={incident.opened_at ? formatDateTime(incident.opened_at) : "—"}
                />
                <DetailRow
                  icon={<IconUser />}
                  label="Assigned To"
                  value={incident.assignee_name ?? incident.assigned_to ?? "—"}
                />
                <DetailRow icon={<IconCamera />} label="Camera"      value={detail?.explanation?.camera?.label ?? "—"} />
                {incident.summary && (
                  <DetailRow
                    icon={<IconDesc />}
                    label="Description"
                    value={incident.summary}
                    multiLine
                  />
                )}
              </div>

              {/* ── Evidence ────────────────────────────────────────────── */}
              <div className="ic-drawer-section ic-drawer-section--evidence">
                <EvidencePanel incidentId={incidentId} />
              </div>

              {/* ── Latest Activity ─────────────────────────────────────── */}
              <div className="ic-drawer-section ic-drawer-section--timeline">
                <div className="ic-drawer-section-title">Latest Activity</div>
                <TimelinePanel entries={timeline} />
              </div>
            </>
          )}

          {query.isLoading && !incident && (
            <div className="ic-drawer-section">
              <p style={{ color: "#9ca3af", fontSize: "0.8125rem" }}>Loading incident…</p>
            </div>
          )}
        </div>

        {/* ── Footer: two equal-width buttons ────────────────────────────── */}
        {incident && (
          <div className="ic-drawer-footer">
            {/* View full details — navigate to the standalone Incident Detail page */}
            <Link
              to={`/incidents/${incidentId}`}
              className="ic-footer-btn ic-footer-btn--details"
              onClick={onClose}
            >
              View full details
            </Link>

            {/* Add Note — disabled, pending backend */}
            <button
              type="button"
              className="ic-footer-btn ic-footer-btn--note"
              disabled
              aria-disabled="true"
              title="Note-taking is not yet available — backend API endpoint pending approval."
            >
              <IconNote />
              Add Note
            </button>

            {/* Take Action dropdown */}
            <Can permission="incidents.update">
              <div className="ic-take-action-wrap" ref={takeActionRef}>
                {takeActionOpen && (
                  <div className="ic-take-action-menu" role="menu">
                    <button type="button" className="ic-take-action-item" disabled={!canInvestigate} onClick={() => handleActionSelect("investigate")}>
                      Start investigation
                    </button>
                    <Can permission="incidents.escalate">
                      <button type="button" className="ic-take-action-item" disabled={!canEscalate} onClick={() => handleActionSelect("escalate")}>
                        Escalate
                      </button>
                    </Can>
                    <button type="button" className="ic-take-action-item" disabled={!canResolve} onClick={() => handleActionSelect("resolve")}>
                      Mark resolved
                    </button>
                    <button type="button" className="ic-take-action-item ic-take-action-item--danger" disabled={!canClose} onClick={() => handleActionSelect("close")}>
                      Close incident
                    </button>
                    <Can permission="incidents.notify_authorities">
                      {canNotify && (
                        <button type="button" className="ic-take-action-item" onClick={() => handleActionSelect("notify")}>
                          Notify authorities
                        </button>
                      )}
                    </Can>
                    <button type="button" className="ic-take-action-item" disabled title="Not yet supported by the backend.">
                      Mark false positive
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="ic-footer-btn ic-footer-btn--action"
                  onClick={() => setTakeActionOpen((p) => !p)}
                  aria-haspopup="menu"
                  aria-expanded={takeActionOpen}
                >
                  <IconAction />
                  Take Action
                  <IconChevron />
                </button>
              </div>
            </Can>
          </div>
        )}
      </aside>

      {/* ── Confirm dialog for pending action ─────────────────────────────── */}
      {cfg && (
        <ConfirmDialog
          open={!!pendingAction}
          onClose={() => (submitting ? undefined : setPendingAction(null))}
          title={cfg.title}
          description={cfg.description}
          confirmLabel={cfg.confirmLabel}
          tone={cfg.tone ?? "primary"}
          loading={submitting}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
