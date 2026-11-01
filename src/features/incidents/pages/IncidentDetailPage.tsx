import { useState, useRef, useEffect, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import LoadingState from "../../../components/ui/state/LoadingState";
import ErrorState from "../../../components/ui/state/ErrorState";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useAuthz } from "../../../hooks/useAuthz";
import { useOrganization } from "../../../context/OrganizationContext";
import { useAuthenticatedImage } from "../../../hooks/useAuthenticatedImage";
import { env } from "../../../config/env";
import IncidentTimelinePanel from "../components/IncidentTimelinePanel";
import EditIncidentButton from "../components/EditIncidentButton";
import { useIncident } from "../hooks/useIncident";
import { useIncidentsRealtime } from "../hooks/useIncidentsRealtime";
import { useIncidentActions } from "../hooks/useIncidentActions";
import { useIncidentDetections } from "../hooks/useIncidentDetections";
import {
  formatDateTime,
  incidentSeverityTone,
  incidentStatusTone,
  titleCase,
} from "../components/incidentTone";
import type { TimelineEntry } from "../api/incidents.types";
import ThreatScoreGauge from "../../intel/components/ThreatScoreGauge";
import OpenAssignmentButton from "../../assignments/components/OpenAssignmentButton";
import { useAssignmentsRealtime } from "../../assignments/hooks/useAssignmentsRealtime";
import { humanize as humanizeAssignment } from "../../assignments/components/assignmentTone";
import type { Assignment, AssignmentResponderLine } from "../../assignments/api/assignments.types";

// ── Duration ──────────────────────────────────────────────────────────────────

function formatDuration(from: string | null, to: string | null): string {
  if (!from) return "—";
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  const secs = Math.max(0, Math.floor((end - start) / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  if (mins < 60) return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

// ── Hero detail field (col-3 vertical list with icon) ─────────────────────────

function HeroDetailField({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-gray-400">{icon}</div>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</dt>
        <dd className="mt-0.5 text-sm text-gray-800 dark:text-gray-200">{children}</dd>
      </div>
    </div>
  );
}

// ── Event metadata row (right column) ─────────────────────────────────────────

function EventMetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2 last:border-0 dark:border-gray-800">
      <dt className="shrink-0 text-xs text-gray-400">{label}</dt>
      <dd className="text-right text-xs font-medium text-gray-700 dark:text-gray-300">{value}</dd>
    </div>
  );
}

// ── Response log row (matches reference .response-item) ─────────────────────

// ── Compact assignment summary for the Response Log ──────────────────────────

/**
 * Compact assignment state shown at the top of the Response Log.
 * Uses the assignment already embedded in the incident detail response —
 * no extra network call. Shows current dispatch status and active responder
 * lines, or an "Open assignment" action when no dispatch has been started.
 */
function AssignmentSummary({
  assignment,
  incidentId,
}: {
  assignment: Assignment | null;
  incidentId: string;
}) {
  if (!assignment) {
    return (
      <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-2 dark:border-gray-700">
        <span className="text-[11px] text-gray-400 dark:text-gray-500">No active assignment</span>
        <Can permission="assignments.dispatch">
          <OpenAssignmentButton incidentId={incidentId} />
        </Can>
      </div>
    );
  }

  const activeLines = (assignment.responders ?? []).filter(
    (r: AssignmentResponderLine) => !["completed", "declined", "timed_out", "stood_down", "cancelled"].includes(r.status),
  );

  return (
    <div className="mb-3 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2 dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Assignment
          </span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none ${
              ["active", "filled"].includes(assignment.status)
                ? "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800/40"
                : ["escalated"].includes(assignment.status)
                ? "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40"
                : ["cancelled", "completed"].includes(assignment.status)
                ? "bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                : "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40"
            }`}
          >
            {humanizeAssignment(assignment.status)}
          </span>
        </div>
        <Link
          to={`/assignments/${assignment.id}`}
          className="shrink-0 text-[10px] font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          View →
        </Link>
      </div>
      {activeLines.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {activeLines.map((line: AssignmentResponderLine) => (
            <li key={line.id} className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-700 dark:text-gray-300">
                {line.responder_name ?? `Responder ${line.responder_id.slice(0, 6)}`}
              </span>
              <span className="text-[9px] text-gray-400">·</span>
              <span className="text-[9px] capitalize text-gray-400 dark:text-gray-500">
                {line.role}
              </span>
              <span className="text-[9px] text-gray-400">·</span>
              <span
                className={`text-[9px] font-medium ${
                  ["on_scene", "accepted"].includes(line.status)
                    ? "text-teal-600 dark:text-teal-400"
                    : line.status === "en_route"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {humanizeAssignment(line.status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Resolve a display name for the actor who produced a timeline entry.
 *
 * Resolution priority (highest to lowest):
 * 1. For responder lifecycle events: match payload.responder_id against the
 *    assignment's responder lines (already in IncidentDetail — no extra request).
 * 2. For dispatcher/operator events: use actor_name supplied by the backend
 *    (via the actor eager-load added to IncidentTimelineService).
 * 3. For system-generated events (timed_out, escalated automatically): "System".
 * 4. Honest fallback when a responder_id is present but not in the assignment
 *    (e.g. a previous assignment's responders): "Unknown responder".
 * 5. Final fallback for anything else without an identifiable actor: "System".
 */
function resolveActorName(
  entry: TimelineEntry,
  assignment: Assignment | null,
): string {
  const responderId = entry.payload?.responder_id as string | undefined;

  // Responder lifecycle events carry responder_id in the payload.
  if (responderId) {
    const line = assignment?.responders?.find(
      (r: AssignmentResponderLine) => r.responder_id === responderId,
    );
    if (line?.responder_name) return line.responder_name;
    // responder_id present but not in current assignment (prior assignment)
    return "Unknown responder";
  }

  // Dispatcher/operator events use the actor_name the backend now provides.
  if (entry.actor_name) return entry.actor_name;

  // Automated system transitions have no human actor.
  return "System";
}

function ResponseLogRow({
  entry,
  actorName,
}: {
  entry: TimelineEntry;
  actorName: string;
}) {
  const isNamedActor = actorName !== "System" && actorName !== "Unknown responder";

  // ── Badge colour ─────────────────────────────────────────────────────────
  const badgeCls =
    entry.type === "assignment.dispatch_escalated" ||
    entry.type.includes("escalat") ||
    entry.type.includes("declin") ||
    entry.type.includes("timed_out") ||
    entry.type.includes("stood_down")
      ? "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40"
    : entry.type.includes("resolv") ||
      entry.type === "assignment.completed" ||
      entry.type.includes("accept") ||
      entry.type.includes("on_scene") ||
      entry.type.includes("complet")
      ? "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800/40"
    : entry.type === "assignment.cancelled" || entry.type.includes("clos")
      ? "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    : entry.type.includes("en_route")
      ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40"
    : "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40";

  // ── Clean badge label ─────────────────────────────────────────────────────
  const badgeLabel =
    entry.type === "assignment.responder_offered"     ? "Responder Assigned"    :
    entry.type === "assignment.responder_accepted"    ? "Responder Accepted"    :
    entry.type === "assignment.responder_declined"    ? "Responder Declined"    :
    entry.type === "assignment.responder_timed_out"   ? "Offer Timed Out"       :
    entry.type === "assignment.responder_stood_down"  ? "Responder Stood Down"  :
    entry.type === "assignment.responder_en_route"    ? "Responder En Route"    :
    entry.type === "assignment.responder_on_scene"    ? "Responder On Scene"    :
    entry.type === "assignment.responder_completed"   ? "Responder Completed"   :
    entry.type === "assignment.created"               ? "Assignment Created"    :
    entry.type === "assignment.cancelled"             ? "Assignment Cancelled"  :
    entry.type === "assignment.completed"             ? "Assignment Completed"  :
    entry.type === "assignment.dispatch_escalated"    ? "Dispatch Escalated"    :
    entry.type.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Description sentence (actor name baked in for human actors) ──────────
  const description =
    entry.type === "assignment.responder_offered"
      ? (isNamedActor ? `${actorName} was assigned to respond.`                  : "Assignment offered to a responder.")
    : entry.type === "assignment.responder_accepted"
      ? (isNamedActor ? `${actorName} accepted the assignment.`                  : "Responder accepted the assignment.")
    : entry.type === "assignment.responder_declined"
      ? (isNamedActor ? `${actorName} declined the offer.`                       : "Responder declined the offer.")
    : entry.type === "assignment.responder_timed_out"
      ? (isNamedActor ? `Offer expired — ${actorName} did not respond in time.`  : "Offer expired — responder did not respond in time.")
    : entry.type === "assignment.responder_stood_down"
      ? (isNamedActor ? `${actorName} stood down from the assignment.`           : "Responder stood down from the assignment.")
    : entry.type === "assignment.responder_en_route"
      ? (isNamedActor ? `${actorName} is en route to the scene.`                 : "Responder is en route to the scene.")
    : entry.type === "assignment.responder_on_scene"
      ? (isNamedActor ? `${actorName} arrived on scene.`                         : "Responder arrived on scene.")
    : entry.type === "assignment.responder_completed"
      ? (isNamedActor ? `${actorName} completed the response.`                   : "Responder completed the response.")
    : entry.type === "assignment.created"
      ? (isNamedActor ? `${actorName} created the assignment.`                   : "Assignment created for this incident.")
    : entry.type === "assignment.cancelled"          ? "Assignment cancelled. Responders stood down."
    : entry.type === "assignment.completed"          ? "Assignment completed. Responders released."
    : entry.type === "assignment.dispatch_escalated" ? "Dispatch escalated — no responder accepted in time."
    : "Event recorded by the system.";

  return (
    <div className="border-b border-gray-100 py-2 last:border-0 dark:border-gray-800/60">
      {/* Row 1: clean badge label (left) + timestamp (right) */}
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ${badgeCls}`}>
          {badgeLabel}
        </span>
        {entry.at && (
          <time className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
            {formatDateTime(entry.at)}
          </time>
        )}
      </div>
      {/* Row 2: actor name baked into description sentence */}
      <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}
// ── Camera still panel with overlay ──────────────────────────────────────────

function DetectionEvidencePanel({
  incidentId,
  cameraLabel,
  compact = false,
}: {
  incidentId: string;
  cameraLabel: string | null;
  compact?: boolean;
}) {
  const { activeId } = useOrganization();
  const containerRef = useRef<HTMLDivElement>(null);
  const captureUrl =
    activeId && incidentId
      ? `${env.apiBaseUrl}/organizations/${activeId}/incidents/${incidentId}/capture`
      : null;
  const { src, status } = useAuthenticatedImage(captureUrl);

  function handleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen();
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl bg-gray-900 ${compact ? "max-h-52" : ""}`}
      style={compact ? { aspectRatio: "16/9", maxHeight: "208px" } : { aspectRatio: "16/9" }}
    >
      {/* Loading placeholder */}
      {status === "loading" && (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-500">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-sm">Loading frame…</span>
        </div>
      )}

      {/* Error placeholder */}
      {status === "error" && (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-500">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-sm">No capture available</span>
        </div>
      )}

      {/* Actual image */}
      {src && status !== "error" && (
        <img
          src={src}
          alt="Still frame from detection camera"
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}

      {/* Overlay: camera label bottom-left + fullscreen bottom-right */}
      {src && status !== "error" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
          {cameraLabel && (
            <span className="pointer-events-none flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              {cameraLabel}
            </span>
          )}
          <button
            type="button"
            onClick={handleFullscreen}
            aria-label="Toggle fullscreen"
            className="pointer-events-auto rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/80"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Incident-type decorative illustration ─────────────────────────────────────

function IncidentIllustration({ type, severity }: { type: string; severity: string }) {
  const t = type.toLowerCase();
  // compact dome — sits fully in the lower portion of the card
  const cls = "h-[130px] w-full opacity-90";
  const vb = "0 0 200 130";
  const par = "xMidYMax slice";
  // Dome: cy=130 ry=55 → peak at y=75, safely below all text content
  const dome = (fill: string) => <ellipse cx="100" cy="130" rx="115" ry="55" fill={fill}/>;

  // Fire / smoke
  if (t.includes("fire") || t.includes("smoke") || t.includes("flame")) {
    return (
      <svg viewBox={vb} preserveAspectRatio={par} fill="none" aria-hidden="true" className={cls}>
        {dome("#FEF3C7")}
        {/* Compact flame — centered at (100, 92) */}
        <path d="M100 78 C100 78 112 88 112 97 C112 102.5 106.6 107 100 107 C93.4 107 88 102.5 88 97 C88 88 100 78 100 78Z" fill="#F97316"/>
        <path d="M100 85 C100 85 106 92 106 97 C106 99.8 103.3 102 100 102 C96.7 102 94 99.8 94 97 C94 92 100 85 100 85Z" fill="#FDE68A"/>
        <path d="M100 93 C100 93 102.5 96 102.5 98 C102.5 99.4 101.4 100.5 100 100.5 C98.6 100.5 97.5 99.4 97.5 98 C97.5 96 100 93 100 93Z" fill="white" opacity="0.75"/>
        <ellipse cx="100" cy="108" rx="13" ry="2.5" fill="#FED7AA"/>
      </svg>
    );
  }

  // Weapon / armed — handgun silhouette
  if (t.includes("weapon") || t.includes("armed") || t.includes("gun") || t.includes("threat")) {
    return (
      <svg viewBox={vb} preserveAspectRatio={par} fill="none" aria-hidden="true" className={cls}>
        {dome("#FEE2E2")}
        {/* Slide — top body of pistol */}
        <rect x="62" y="83" width="72" height="15" rx="3.5" fill="#EF4444"/>
        {/* Barrel — protrudes left */}
        <rect x="46" y="87" width="20" height="7" rx="2" fill="#DC2626"/>
        {/* Lower frame rail */}
        <rect x="100" y="98" width="34" height="4" rx="1.5" fill="#EF4444"/>
        {/* Grip (angled) */}
        <path d="M114 101 L132 101 L136 119 L110 119 Z" fill="#EF4444"/>
        {/* Trigger guard */}
        <path d="M91 101 C91 116 110 116 114 116 L114 119 L88 119 L88 101Z" fill="#EF4444" opacity="0.85"/>
        {/* Trigger */}
        <rect x="99" y="105" width="3.5" height="8" rx="1" fill="#B91C1C"/>
        {/* Front sight */}
        <rect x="50" y="79" width="5" height="5" rx="1.5" fill="#DC2626"/>
        {/* Rear sight */}
        <rect x="120" y="79" width="10" height="4" rx="1" fill="#DC2626"/>
        {/* Muzzle flash glow */}
        <circle cx="42" cy="90" r="5" fill="#FCA5A5" opacity="0.55"/>
      </svg>
    );
  }

  // Intrusion / perimeter / trespass
  if (t.includes("intrus") || t.includes("trespass") || t.includes("perimeter") || t.includes("fence")) {
    return (
      <svg viewBox={vb} preserveAspectRatio={par} fill="none" aria-hidden="true" className={cls}>
        {dome("#FFFBEB")}
        {/* Person — head + body compact at right side */}
        <circle cx="128" cy="79" r="8" fill="#F59E0B"/>
        <path d="M128 87 L122 99 L130 99 L128 87Z" fill="#F59E0B"/>
        <path d="M122 99 L116 111 M130 99 L136 111" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M122 92 L114 97 M128 92 L136 97" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round"/>
        {/* Fence — left side */}
        <line x1="72" y1="83" x2="72" y2="112" stroke="#D97706" strokeWidth="4" strokeLinecap="round"/>
        <line x1="84" y1="78" x2="84" y2="112" stroke="#D97706" strokeWidth="4" strokeLinecap="round"/>
        <line x1="72" y1="90" x2="84" y2="90" stroke="#D97706" strokeWidth="3"/>
        <line x1="72" y1="103" x2="84" y2="103" stroke="#D97706" strokeWidth="3"/>
      </svg>
    );
  }

  // Crowd / gathering
  if (t.includes("crowd") || t.includes("gather") || t.includes("assembly")) {
    return (
      <svg viewBox={vb} preserveAspectRatio={par} fill="none" aria-hidden="true" className={cls}>
        {dome("#EFF6FF")}
        {/* 3 heads — all inside dome (y ≥ 76) */}
        <circle cx="70" cy="82" r="9" fill="#3B82F6"/>
        <circle cx="100" cy="77" r="9.5" fill="#2563EB"/>
        <circle cx="130" cy="82" r="9" fill="#3B82F6"/>
        {/* Shoulders / body mass */}
        <path d="M46 115 C46 99 82 94 70 94 C58 94 46 99 46 115Z" fill="#3B82F6"/>
        <path d="M74 115 C74 97 126 92 100 92 C74 92 74 97 74 115Z" fill="#2563EB"/>
        <path d="M106 115 C106 99 154 94 130 94 C106 94 106 99 106 115Z" fill="#3B82F6"/>
      </svg>
    );
  }

  // Flood / water
  if (t.includes("flood") || t.includes("water") || t.includes("leak")) {
    return (
      <svg viewBox={vb} preserveAspectRatio={par} fill="none" aria-hidden="true" className={cls}>
        {dome("#EFF6FF")}
        {/* Waves */}
        <path d="M22 96 Q42 85 62 96 Q82 107 102 96 Q122 85 142 96 Q158 105 178 97 L178 116 L22 116 Z" fill="#3B82F6"/>
        <path d="M22 85 Q42 74 62 85 Q82 96 102 85 Q122 74 142 85 Q158 94 178 86 L178 100 Q158 108 138 97 Q118 86 98 97 Q78 108 58 97 Q38 86 22 97Z" fill="#60A5FA"/>
        {/* Droplet — compact, fully inside dome */}
        <path d="M100 76 C100 76 92 86 92 92 C92 96.4 95.6 100 100 100 C104.4 100 108 96.4 108 92 C108 86 100 76 100 76Z" fill="#93C5FD"/>
      </svg>
    );
  }

  // Medical / injury
  if (t.includes("medic") || t.includes("injur") || t.includes("health")) {
    return (
      <svg viewBox={vb} preserveAspectRatio={par} fill="none" aria-hidden="true" className={cls}>
        {dome("#FEE2E2")}
        {/* Compact cross — centered at (100, 96) */}
        <rect x="93" y="77" width="14" height="38" rx="4" fill="#EF4444"/>
        <rect x="80" y="90" width="40" height="14" rx="4" fill="#EF4444"/>
        <rect x="95.5" y="79.5" width="9" height="33" rx="3" fill="#FCA5A5" opacity="0.45"/>
        <rect x="82.5" y="92.5" width="35" height="9" rx="3" fill="#FCA5A5" opacity="0.45"/>
      </svg>
    );
  }

  // Default: generic alert shield
  const severityColor = {
    critical: "#EF4444",
    high:     "#F97316",
    medium:   "#EAB308",
    low:      "#3B82F6",
  }[severity] ?? "#F97316";
  const bgColor = {
    critical: "#FEE2E2",
    high:     "#FEF3C7",
    medium:   "#FEF9C3",
    low:      "#EFF6FF",
  }[severity] ?? "#FEF3C7";

  return (
    <svg viewBox={vb} preserveAspectRatio={par} fill="none" aria-hidden="true" className={cls}>
      {dome(bgColor)}
      {/* Compact shield — centered at (100, 97) */}
      <path d="M100 77 L120 87 L120 100 C120 109 112 116 100 120 C88 116 80 109 80 100 L80 87 Z" fill={severityColor} opacity="0.18"/>
      <path d="M100 82 L116 91 L116 100 C116 107 110 113 100 116 C90 113 84 107 84 100 L84 91 Z" fill={severityColor} opacity="0.28"/>
      <line x1="100" y1="94" x2="100" y2="106" stroke={severityColor} strokeWidth="4" strokeLinecap="round"/>
      <circle cx="100" cy="112" r="3" fill={severityColor}/>
    </svg>
  );
}
// ── Card base ─────────────────────────────────────────────────────────────────

const card =
  "rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

// ── Hero icons ────────────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function IconStatus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14"/>
      <line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/>
      <line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/>
      <line x1="9" y1="8" x2="15" y2="8"/>
      <line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  );
}

function IconSource() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 7l-7 5 7 5V7z"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function IncidentDetailPage() {
  const { id = "" } = useParams();
  const { connected } = useIncidentsRealtime();
  // Subscribe to the assignment channel so dispatch transitions (responder
  // accepted, en-route, etc.) refresh both the incident query (which embeds
  // the assignment) and the timeline without a manual reload.
  useAssignmentsRealtime();
  const { principal } = useAuthz();
  const query   = useIncident(id);
  const actions = useIncidentActions(id);
  const incidentDetections = useIncidentDetections(id);
  const detail  = query.data?.data;
  const [authoritiesNotes, setAuthoritiesNotes] = useState("");
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const actionsDropRef = useRef<HTMLDivElement>(null);
  const [actionsStyle, setActionsStyle] = useState<CSSProperties>({});

  // Position + close-outside for the portalled Actions dropdown
  useEffect(() => {
    if (!actionsMenuOpen || !actionsBtnRef.current) return;
    const rect = actionsBtnRef.current.getBoundingClientRect();
    const w = 200;
    setActionsStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: Math.max(4, rect.right - w),
      width: w,
      zIndex: 99999,
    });
    const onOutside = (e: MouseEvent) => {
      if (
        actionsDropRef.current && !actionsDropRef.current.contains(e.target as Node) &&
        actionsBtnRef.current && !actionsBtnRef.current.contains(e.target as Node)
      ) {
        setActionsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [actionsMenuOpen]);

  const breadcrumbs = [
    { label: "Incidents", to: "/incidents" },
    { label: detail?.incident.title ?? "Detail" },
  ];

  if (query.isLoading) {
    return (
      <>
        <PageHeader title="Incident Detail" breadcrumbs={breadcrumbs} />
        <LoadingState />
      </>
    );
  }

  if (query.error || !detail) {
    return (
      <>
        <PageHeader title="Incident Detail" breadcrumbs={breadcrumbs} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    );
  }

  const { incident, assignment, timeline, explanation } = detail;

  const canEditDetails =
    principal !== null &&
    (principal.id === incident.opened_by || principal.roles.includes("Supervisor"));

  const site        = explanation?.camera?.site ?? null;
  const zone        = explanation?.camera?.zone ?? null;
  const cameraLabel = explanation?.camera?.label ?? null;
  const locationLine = [site, zone].filter(Boolean).join(" — ");
  const durationEnd  = incident.resolved_at ?? incident.closed_at ?? null;
  const displayId    = `INC-${incident.id.slice(0, 8).toUpperCase()}`;

  return (
    <>
      <PageMeta title={`${incident.title} | Sentrix Console`} description="Incident detail" />

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="Incident Detail"
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <RealtimeIndicator connected={connected} />

            {/* ── Actions dropdown — portalled so it never shifts page layout ── */}
            {incident.status !== "closed" && (
              <>
                <button
                  ref={actionsBtnRef}
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setActionsMenuOpen((p) => !p)}
                  aria-haspopup="menu"
                  aria-expanded={actionsMenuOpen}
                >
                  Actions
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {actionsMenuOpen && createPortal(
                  <div ref={actionsDropRef} className="ic-row-menu-dropdown" role="menu" style={actionsStyle}>
                    {!["resolved", "closed"].includes(incident.status) && canEditDetails && (
                      <EditIncidentButton incident={incident} triggerClassName="ic-row-menu-item" />
                    )}
                    {incident.status === "open" && (
                      <ConfirmActionButton label="Investigate" title="Start investigation?" description="Move this incident to investigating." confirmLabel="Start" successMessage="Investigation started" onConfirm={() => actions.investigate.mutateAsync()} triggerClassName="ic-row-menu-item" />
                    )}
                    {["open", "investigating"].includes(incident.status) && (
                      <ConfirmActionButton label="Escalate" title="Escalate incident?" description="Escalate this incident for higher-priority response." confirmLabel="Escalate" successMessage="Incident escalated" onConfirm={() => actions.escalate.mutateAsync()} triggerClassName="ic-row-menu-item" />
                    )}
                    <ConfirmActionButton label="Notify authorities" tone="danger" title="Record that authorities were notified?" description="This records that you personally contacted external authorities. No automated dispatch." confirmLabel="Record" successMessage="Recorded" onOpen={() => setAuthoritiesNotes("")} onConfirm={() => actions.notifyAuthorities.mutateAsync(authoritiesNotes || undefined)} triggerClassName="ic-row-menu-item ic-row-menu-item--danger">
                      <textarea value={authoritiesNotes} onChange={(e) => setAuthoritiesNotes(e.target.value)} placeholder="Notes — who you contacted, reference number, etc. (optional)" rows={3} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90" />
                    </ConfirmActionButton>
                    {["open", "investigating", "escalated"].includes(incident.status) && (
                      <ConfirmActionButton label="Resolve" title="Resolve incident?" description="Mark this incident as resolved." confirmLabel="Resolve" successMessage="Incident resolved" onConfirm={() => actions.resolve.mutateAsync()} triggerClassName="ic-row-menu-item" />
                    )}
                    {incident.status === "resolved" && (
                      <ConfirmActionButton label="Re-open investigation" title="Re-open investigation?" description="Move this incident back to investigating status." confirmLabel="Re-open" successMessage="Investigation re-opened" onConfirm={() => actions.investigate.mutateAsync()} triggerClassName="ic-row-menu-item" />
                    )}
                    {incident.status === "resolved" && (
                      <ConfirmActionButton label="Close" tone="danger" title="Close incident?" description="Closing finalizes this incident and removes it from active queues." confirmLabel="Close" successMessage="Incident closed" onConfirm={() => actions.close.mutateAsync()} triggerClassName="ic-row-menu-item ic-row-menu-item--danger" />
                    )}
                  </div>,
                  document.body
                )}
              </>
            )}
          </div>
        }
      />

      {/* ── Hero row: 3 stat cards ─────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-stretch md:gap-5">

        {/* Card 1: Incident identity — reference stat-card style */}
        <div className={`${card} relative flex flex-col overflow-hidden`}>
          {/* Top row: type label (left) + severity badge (right) */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Incident
            </p>
            <StatusBadge tone={incidentSeverityTone[incident.severity]}>
              {titleCase(incident.severity)}
            </StatusBadge>
          </div>

          {/* Title */}
          <h2 className="mt-2 text-2xl font-bold leading-tight text-gray-900 dark:text-white">
            {incident.title}
          </h2>

          {/* ID + location */}
          <p className="mt-1 font-mono text-xs text-gray-400 dark:text-gray-500 tracking-wide">
            {displayId}
          </p>
          {locationLine && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{locationLine}</p>
          )}

          {/* Illustration — hidden on mobile, shown on sm+ */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 hidden sm:flex items-end justify-center">
            <IncidentIllustration
              type={incident.title}
              severity={incident.severity}
            />
          </div>
        </div>

        {/* Card 2: Threat score — reuse shared ThreatScoreGauge (ApexCharts arc) */}
        <ThreatScoreGauge score={incident.risk_score ?? 0} />

        {/* Card 3: Incident details */}
        <div className={card}>
          <dl className="flex flex-col gap-4">
            <HeroDetailField icon={<IconCalendar />} label="Detected">
              {formatDateTime(incident.opened_at)}
            </HeroDetailField>
            <HeroDetailField icon={<IconClock />} label="Duration">
              {formatDuration(incident.opened_at, durationEnd)}
            </HeroDetailField>
            <HeroDetailField icon={<IconStatus />} label="Status">
              <StatusBadge tone={incidentStatusTone[incident.status]}>
                {titleCase(incident.status)}
              </StatusBadge>
            </HeroDetailField>
            <HeroDetailField icon={<IconSource />} label="Source">
              {cameraLabel ?? "—"}
            </HeroDetailField>
          </dl>
        </div>
      </div>

      {/* ── 3-column body: Timeline | Still + AI | Event Metadata ─────────── */}
      <div className="grid grid-cols-12 gap-4 md:gap-5">

        {/* Col-1: Incident Timeline */}
        <div className="col-span-12 flex lg:col-span-3">
          <div className={`${card} flex h-full w-full flex-col`}>
            <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
              Incident Timeline
            </h3>
            <IncidentTimelinePanel entries={timeline} />
          </div>
        </div>

        {/* Col-2: Detection Still + AI Explanation */}
        <div className="col-span-12 space-y-4 lg:col-span-6 md:space-y-6">

          {/* ── Combined Detection Still + AI Explanation (one card) ── */}
          {explanation ? (
            <div className={card}>

              {/* Card header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    Detection Still
                  </h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    Frame capture
                  </span>
                </div>
              </div>

              {/* Camera image — compact height so AI section is visible */}
              <DetectionEvidencePanel
                incidentId={incident.id}
                cameraLabel={cameraLabel}
                compact
              />

              {/* AI Explanation — directly below image, no separate card */}
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                <div className="mb-2 flex items-center gap-1.5">
                  <svg
                    width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round" className="text-brand-500" aria-hidden="true"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    AI Explanation
                  </span>
                </div>

                {/* Observed description */}
                {explanation.observed?.description ? (
                  <p className="text-[12px] leading-relaxed text-gray-700 dark:text-gray-300">
                    {explanation.observed.description}
                  </p>
                ) : (
                  <p className="text-[12px] italic text-gray-400">No AI description available.</p>
                )}

                {/* Detection label chips */}
                {(explanation.observed?.detections ?? []).length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {explanation.observed!.detections.map((d, i) =>
                      d.label ? (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700 dark:border-teal-800/50 dark:bg-teal-900/20 dark:text-teal-400"
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          {d.label}
                          {d.confidence != null && (
                            <span className="ml-0.5 opacity-60">{Math.round(d.confidence * 100)}%</span>
                          )}
                        </span>
                      ) : null
                    )}
                  </div>
                )}

                {/* Model / Confidence row — matches reference .model-row */}
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-gray-100 pt-3 text-[11px] text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Model: </span>
                        Sentrix Perimeter Guard 1.0
                      </span>
                    {explanation.assessment?.basis_confidence != null && (
                      <span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Confidence: </span>
                        {(explanation.assessment.basis_confidence * 100).toFixed(1)}%
                      </span>
                    )}
                </div>

              </div>
            </div>
          ) : null}

          {/* Incident summary fallback (only when no explanation description) */}
          {incident.summary && !explanation?.observed?.description && (
            <div className={card}>
              <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Summary</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{incident.summary}</p>
            </div>
          )}

          {/* Authorities notified notice */}
          {incident.authorities_notified_at && (
            <div className={`${card} border-orange-200 dark:border-orange-900/40`}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-orange-500">
                Authorities notified
              </p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {formatDateTime(incident.authorities_notified_at)}
                {incident.authorities_notes && ` — ${incident.authorities_notes}`}
              </p>
            </div>
          )}

          {/* Emergency link */}
          {incident.emergency_id && (
            <div className={card}>
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Linked Emergency</p>
              <Link
                to={`/emergencies/${incident.emergency_id}`}
                className="mt-1 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                {incident.emergency_id.slice(0, 8)}
              </Link>
            </div>
          )}
        </div>

        {/* Col-3: Event Metadata + Assignment */}
        <div className="col-span-12 flex lg:col-span-3">

          <div className={`${card} flex h-full w-full flex-col`}>
            <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
              Event Metadata
            </h3>
            <dl>
              <EventMetaRow label="Detection ID" value={<span className="font-mono">{displayId}</span>} />
              {site        && <EventMetaRow label="Site"            value={site} />}
              {zone        && <EventMetaRow label="Area"            value={zone} />}
              {cameraLabel && <EventMetaRow label="Device"          value={cameraLabel} />}
              {explanation?.assessment?.matched_rule && (
                <EventMetaRow label="Rule Triggered" value={explanation.assessment.matched_rule} />
              )}
              {explanation?.assessment?.matched_term && (
                <EventMetaRow label="Matched Term"   value={explanation.assessment.matched_term} />
              )}
              {explanation?.assessment?.severity && (
                <EventMetaRow label="Severity"       value={titleCase(explanation.assessment.severity)} />
              )}
              {explanation?.assessment?.trigger_threshold != null && (
                <EventMetaRow label="Trigger Threshold" value={`≥ ${explanation.assessment.trigger_threshold}`} />
              )}
              {explanation?.analysis?.provider && (
                <EventMetaRow label="AI Provider"    value={explanation.analysis.provider} />
              )}
              {incident.escalated_at && (
                <EventMetaRow label="Escalated"      value={formatDateTime(incident.escalated_at)} />
              )}
              {incident.resolved_at && (
                <EventMetaRow label="Resolved"       value={formatDateTime(incident.resolved_at)} />
              )}
              {incident.closed_at && (
                <EventMetaRow label="Closed"         value={formatDateTime(incident.closed_at)} />
              )}
            </dl>
          </div>


        </div>
      </div>

      {/* ── Lower row: Evidence + Notes (left) | Response Log (right) ──────── */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:mt-5 md:gap-5 lg:grid-cols-2">

        {/* Left column — Evidence and Notes stacked in one card */}
        <div className={card}>
          {/* ── Evidence ── */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {incidentDetections.data?.data && incidentDetections.data.data.length > 0
                ? `Evidence (${incidentDetections.data.data.length})`
                : "Evidence"}
            </h3>
          </div>
          {incidentDetections.isLoading ? (
            /* Detection list loading — show a single skeleton slot */
            <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
              <div className="shrink-0 px-1">
                <EvidenceThumbSkeleton />
              </div>
            </div>
          ) : incidentDetections.data?.data && incidentDetections.data.data.length > 0 ? (
            /* Real detection events — one slot per record.
               When there is exactly one record, four static default
               placeholder slots are appended so the strip looks populated.
               They are visual-only and excluded from the evidence count. */
            <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
              {incidentDetections.data.data.map((detection) => (
                <div key={detection.id} className="shrink-0 px-1">
                  <EvidenceThumb
                    incidentId={incident.id}
                    detectionId={detection.id}
                    timestamp={detection.received_at}
                  />
                </div>
              ))}
              {incidentDetections.data.data.length === 1 &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={`default-placeholder-${i}`} className="shrink-0 px-1">
                    <EvidenceThumbDefault />
                  </div>
                ))}
            </div>
          ) : (
            /* No detection events recorded for this incident */
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <svg
                width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5"
                className="mb-2 text-gray-300 dark:text-gray-600"
                aria-hidden="true"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <p className="text-xs text-gray-400 dark:text-gray-500">No detection events for this incident.</p>
            </div>
          )}

          {/* ── Divider ── */}
          <hr className="my-4 border-gray-100 dark:border-gray-800" />

          {/* ── Notes ── */}
          <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Notes</h3>

          {/* Add note — clean input only, no avatar */}
          <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/40">
            <input
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Add a note..."
              disabled
              aria-label="Note input — not yet available"
            />
          </div>

          {/* Demo note entry */}
          <div className="py-1">
            {/* Header row: avatar · name · Internal badge · timestamp (right) */}
            <div className="flex items-center gap-1.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[12px] font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                AD
              </span>
              <span className="text-[14px] font-semibold text-gray-900 dark:text-white">Admin User</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-400">
                <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>
                Internal
              </span>
              <time className="ml-auto shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                {formatDateTime(incident.opened_at)}
              </time>
            </div>
            {/* Note body — aligned under avatar, spans full width */}
            <p className="mt-1.5 pl-[44px] pr-0 text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
              Subject did not have visible credentials. Proceeding with verification per site protocol.
            </p>
          </div>

          <p className="mt-3 text-center text-[12px] text-gray-400 dark:text-gray-500">
            Note creation available in a future release.
          </p>
        </div>

        {/* Right column — Response Log (now half-width, more room to breathe) */}
        <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Response Log</h3>
          </div>
          {/* Compact assignment summary — shows current dispatch state without
              a separate large card. Uses the assignment already embedded in
              the incident detail response (no extra network call). */}
          <AssignmentSummary assignment={assignment} incidentId={incident.id} />
          {(() => {
            // Filter to assignment-domain events only — granular responder
            // lifecycle entries that belong here, not in the Incident Timeline.
            const responseEntries = timeline.filter(e => e.source === "assignment");
            return responseEntries.length > 0 ? (
              <div className="mt-3">
                {responseEntries.map((entry, i) => (
                  <ResponseLogRow
                    key={`${entry.at ?? "na"}-${i}`}
                    entry={entry}
                    actorName={resolveActorName(entry, assignment)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No response events recorded.</p>
            );
          })()}
        </div>
      </div>
    </>
  );
}

// ── Evidence thumbnails ──────────────────────────────────────────────────────

/**
 * Skeleton slot shown while the incident's detection list is loading.
 * Same dimensions as EvidenceThumb so the layout does not jump.
 */
function EvidenceThumbSkeleton() {
  return (
    <div className="flex flex-col gap-1" style={{ width: "176px" }}>
      <div
        className="animate-pulse overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
        style={{ height: "144px", width: "176px" }}
        role="status"
        aria-label="Loading evidence"
      />
      <div className="h-2 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

/**
 * Static visual placeholder slot — used to pad the strip to five visible
 * slots when a new incident has only one real detection record.
 *
 * Contains NO network calls, auth logic, or evidence data.
 * Must never be counted in the Evidence heading.
 * Dimensions match EvidenceThumb (176 × 144 px).
 */
function EvidenceThumbDefault() {
  return (
    <div className="flex flex-col gap-1" style={{ width: "176px" }}>
      <div
        className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800"
        style={{ height: "144px", width: "176px", background: "rgb(20 184 166 / 0.07)" }}
        aria-label="No additional evidence"
      >
        <div className="flex h-full flex-col items-center justify-center gap-1.5">
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5"
            className="text-teal-400/40 dark:text-teal-500/30" aria-hidden="true"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span className="text-[9px] text-teal-500/50 dark:text-teal-400/40">No capture</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Real capture thumbnail for a detection event.
 *
 * Fetches the frame from the private storage endpoint, authenticated via
 * Bearer token. When `detectionId` is supplied the specific detection's
 * frame is requested via `?detection_id=`; otherwise falls back to the
 * primary triggering frame.
 *
 * Per the Mandatory UI Requirement:
 *   - Loading → spinner (no broken UI)
 *   - Image unavailable / load error → styled muted-teal placeholder
 *   - Available → image
 *
 * Dimensions are fixed at 176 × 144 px to match the carousel design.
 */
function EvidenceThumb({
  incidentId,
  detectionId,
  timestamp,
}: {
  incidentId: string;
  detectionId?: string;
  timestamp: string | null;
}) {
  const { activeId } = useOrganization();
  const captureUrl =
    activeId && incidentId
      ? `${env.apiBaseUrl}/organizations/${activeId}/incidents/${incidentId}/capture${detectionId ? `?detection_id=${detectionId}` : ""}`
      : null;
  const { src, status } = useAuthenticatedImage(captureUrl);

  return (
    <div className="flex flex-col gap-1" style={{ width: "176px" }}>
      <div
        className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40"
        style={{ height: "144px", width: "176px" }}
      >
        {status === "loading" ? (
          /* Loading state — spinner + screen-reader label */
          <div className="flex h-full items-center justify-center" role="status">
            <svg
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.5"
              className="animate-spin text-gray-300" aria-hidden="true"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <span className="sr-only">Loading frame</span>
          </div>
        ) : status === "error" || !src ? (
          /* Mandatory UI Requirement — muted-teal placeholder for unavailable image */
          <div
            className="flex h-full flex-col items-center justify-center gap-1.5"
            style={{ background: "rgb(20 184 166 / 0.10)" }}
            aria-label="Image unavailable"
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.5"
              className="text-teal-500/60 dark:text-teal-400/50" aria-hidden="true"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span className="text-[9px] text-teal-600/70 dark:text-teal-400/60">Image unavailable</span>
          </div>
        ) : (
          <img
            src={src}
            alt="Evidence capture"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {timestamp && (
        <time className="block truncate text-[9px] leading-tight text-gray-400 dark:text-gray-500">
          {formatDateTime(timestamp)}
        </time>
      )}
    </div>
  );
}
