import { useEffect, type ReactNode } from "react";
import Can from "../../../components/shared/Can";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import Timeline from "../../../components/ui/timeline/Timeline";
import ErrorState from "../../../components/ui/state/ErrorState";
import CreateIncidentButton from "../../incidents/components/CreateIncidentButton";
import { useEmergency } from "../hooks/useEmergency";
import { useEmergencyEvidence } from "../hooks/useEmergencyEvidence";
import {
  emergencyLabel,
  emergencyStatusTone,
  emergencySeverityTone,
  formatDateTime,
  titleCase,
} from "./emergencyTone";
import type { Emergency, EmergencyEvidence } from "../api/emergencies.types";
import type { TimelineItem } from "../../../components/ui/timeline/Timeline";

// ── Lifecycle helper ──────────────────────────────────────────────────────────

function buildLifecycle(e: Emergency): TimelineItem[] {
  const items: TimelineItem[] = [];
  if (e.triggered_at)
    items.push({ id: "triggered", time: formatDateTime(e.triggered_at), title: "Triggered", tone: "error" });
  if (e.acknowledged_at)
    items.push({ id: "acknowledged", time: formatDateTime(e.acknowledged_at), title: "Acknowledged", tone: "warning" });
  if (e.resolved_at)
    items.push({ id: "resolved", time: formatDateTime(e.resolved_at), title: "Resolved", tone: "success" });
  if (e.cancelled_at)
    items.push({ id: "cancelled", time: formatDateTime(e.cancelled_at), title: "Cancelled", tone: "light" });
  return items;
}

// ── Evidence formatters ───────────────────────────────────────────────────────

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) { n /= 1024; u += 1; }
  return `${n.toFixed(u === 0 ? 0 : 1)} ${units[u]}`;
}

function formatDuration(seconds: number | null): string | null {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ── Single evidence item ──────────────────────────────────────────────────────

function EvidenceItem({ item }: { item: EmergencyEvidence }) {
  const isAudio = item.kind === "audio" || item.content_type?.startsWith("audio/");
  const isVideo = item.kind === "video" || item.content_type?.startsWith("video/");
  const isImage = item.kind === "photo" || item.kind === "screenshot" || item.content_type?.startsWith("image/");
  const duration = formatDuration(item.duration_s);

  return (
    <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
      <div className="flex items-center justify-between text-[11px] text-gray-400">
        <span className="font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">{item.kind}</span>
        <span>{formatDateTime(item.created_at)}</span>
      </div>
      {isAudio && <audio src={item.url} controls className="mt-2 w-full" />}
      {isVideo && <video src={item.url} controls className="mt-2 max-h-48 w-full rounded-lg" />}
      {isImage && <img src={item.url} alt="SOS evidence" className="mt-2 max-h-48 w-full rounded-lg object-contain" />}
      {!isAudio && !isVideo && !isImage && (
        <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-brand-500 hover:underline">
          View file
        </a>
      )}
      <div className="mt-1.5 flex gap-3 text-[11px] text-gray-400">
        {duration && <span>{duration}</span>}
        <span>{formatBytes(item.size_bytes)}</span>
      </div>
    </div>
  );
}

// ── Detail row (label / value pair) ──────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="ic-detail-row">
      <span className="ic-detail-label">{label}</span>
      <span className="ic-detail-val">{value ?? "—"}</span>
    </div>
  );
}

// ── Close icon ────────────────────────────────────────────────────────────────

const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Main drawer ───────────────────────────────────────────────────────────────

interface EmergencyDrawerProps {
  emergencyId: string;
  onClose: () => void;
}

export default function EmergencyDrawer({ emergencyId, onClose }: EmergencyDrawerProps): ReactNode {
  const query = useEmergency(emergencyId);
  const evidenceQuery = useEmergencyEvidence(emergencyId);

  const emergency = query.data?.data;
  const evidence = evidenceQuery.data?.data ?? [];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const label = emergency ? emergencyLabel(emergency.message, emergency.id) : "Loading…";
  const displayId = emergency ? `EMR-${emergency.id.slice(0, 8).toUpperCase()}` : null;

  const { lat, lng } = emergency?.location ?? { lat: null, lng: null };
  const locationStr =
    lat != null && lng != null
      ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`
      : "—";

  const canOpenIncident =
    emergency && ["triggered", "acknowledged"].includes(emergency.status);

  return (
    <>
      {/* Overlay */}
      <div className="ic-drawer-overlay" onClick={onClose} aria-hidden="true" />

      {/* Drawer panel */}
      <aside
        className="ic-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Emergency: ${label}`}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="ic-drawer-header">
          <div className="ic-drawer-hdr-title-row">
            <h2 className="ic-drawer-title">{label}</h2>
            <div className="ic-drawer-hdr-actions">
              {emergency && (
                <StatusBadge tone={emergencyStatusTone[emergency.status]}>
                  {titleCase(emergency.status)}
                </StatusBadge>
              )}
              <button
                type="button"
                className="ic-drawer-close"
                onClick={onClose}
                aria-label="Close emergency details"
              >
                <IconClose />
              </button>
            </div>
          </div>
          {displayId && <div className="ic-drawer-inc-id">{displayId}</div>}
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="ic-drawer-body">

          {query.isError && (
            <div className="ic-drawer-section">
              <p style={{ color: "#ef4444", fontSize: "0.8125rem" }}>
                Failed to load emergency details.
              </p>
            </div>
          )}

          {query.isLoading && !emergency && (
            <div className="ic-drawer-section">
              <p style={{ color: "#9ca3af", fontSize: "0.8125rem" }}>Loading emergency…</p>
            </div>
          )}

          {emergency && (
            <>
              {/* ── Details section ──────────────────────────────────────── */}
              <div className="ic-drawer-section ic-drawer-section--meta">
                <DetailRow label="Location"   value={locationStr} />
                <DetailRow
                  label="Triggered"
                  value={emergency.triggered_at ? formatDateTime(emergency.triggered_at) : "—"}
                />
                <DetailRow
                  label="Linked trip"
                  value={emergency.trip_id ? emergency.trip_id.slice(0, 8) : "—"}
                />
                <DetailRow
                  label="Acknowledged by"
                  value={emergency.acknowledged_by ?? "—"}
                />
                <DetailRow
                  label="Severity"
                  value={
                    <StatusBadge tone={emergencySeverityTone[emergency.severity]}>
                      {titleCase(emergency.severity)}
                    </StatusBadge>
                  }
                />
                {emergency.message && (
                  <DetailRow label="Description" value={emergency.message} />
                )}
              </div>

              {/* ── Lifecycle / Timeline ─────────────────────────────────── */}
              <div className="ic-drawer-section">
                <div className="ic-drawer-section-title">Lifecycle</div>
                <Timeline items={buildLifecycle(emergency)} compact />
              </div>

              {/* ── Captured evidence ────────────────────────────────────── */}
              <div className="ic-drawer-section">
                <div className="ic-drawer-section-title">Captured evidence</div>

                {evidenceQuery.isLoading && (
                  <p style={{ color: "#9ca3af", fontSize: "0.8125rem" }}>Loading…</p>
                )}

                {evidenceQuery.isError && (
                  <ErrorState
                    title="Couldn't load evidence"
                    error={evidenceQuery.error}
                    onRetry={() => void evidenceQuery.refetch()}
                  />
                )}

                {evidenceQuery.isSuccess && evidence.length === 0 && (
                  <p style={{ fontSize: "0.8125rem", color: "#9ca3af" }}>
                    No audio, video, or photo evidence was captured for this SOS.
                  </p>
                )}

                {evidence.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {evidence.map((item) => (
                      <EvidenceItem key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="ic-drawer-footer">
          {/* Cancel — closes the panel, no mutation */}
          <button
            type="button"
            className="ic-footer-btn"
            style={{
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              color: "#374151",
              textDecoration: "none",
            }}
            onClick={onClose}
          >
            Cancel
          </button>

          {/* Open Incident — links new incident to this emergency */}
          {canOpenIncident ? (
            <Can permission="incidents.create">
              <CreateIncidentButton
                emergencyId={emergencyId}
                triggerLabel="Open Incident"
                triggerVariant="primary"
                triggerClassName="w-full"
              />
            </Can>
          ) : (
            /* Disabled placeholder so footer stays balanced */
            <button
              type="button"
              className="ic-footer-btn ic-footer-btn--note"
              disabled
              aria-disabled="true"
              title="Open Incident is only available for triggered or acknowledged emergencies."
            >
              Open Incident
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
