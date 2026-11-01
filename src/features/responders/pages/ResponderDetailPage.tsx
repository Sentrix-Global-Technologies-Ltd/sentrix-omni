import { useState } from "react";
import { useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import LoadingState from "../../../components/ui/state/LoadingState";
import ErrorState from "../../../components/ui/state/ErrorState";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import ResponderAssignmentsPanel from "../components/ResponderAssignmentsPanel";
import { SkillsSection, CertificationsSection, ShiftsSection } from "../components/ResponderProfilePanels";
import { useResponder } from "../hooks/useResponder";
import { useResponderAssignments } from "../hooks/useResponderAssignments";
import { useRespondersRealtime } from "../hooks/useRespondersRealtime";
import { useResponderActions } from "../hooks/useResponderActions";
import {
  useResponderSkills,
  useResponderCertifications,
  useResponderShifts,
} from "../hooks/useResponderProfile";
import {
  formatDateTime,
  relativeTime,
  responderLabel,
  STATUS_OPTIONS,
} from "../components/responderTone";
import "../../incidents/styles/incidents-centre.css";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

type KpiAccent = "critical" | "warning" | "info" | "success" | "neutral";

interface KpiCardProps {
  label: string;
  value: number | null;
  sub?: string;
  accent: KpiAccent;
}

function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div className="ic-stat-card">
      <div className="ic-stat-label">{label}</div>
      <div className="ic-stat-value">
        {value === null ? (
          <span className="ic-stat-skeleton" aria-label="Loading…" />
        ) : (
          value.toLocaleString()
        )}
      </div>
      {sub && <div className="ic-stat-sub">{sub}</div>}
      <div className={`ic-stat-accent ic-stat-accent--${accent}`} />
    </div>
  );
}

export default function ResponderDetailPage() {
  const { id = "" } = useParams();
  const { connected } = useRespondersRealtime();
  const query = useResponder(id);
  const assignmentsQuery = useResponderAssignments(id);
  const skillsQuery = useResponderSkills(id);
  const certsQuery = useResponderCertifications(id);
  const shiftsQuery = useResponderShifts(id);
  const actions = useResponderActions(id);
  const [targetStatus, setTargetStatus] = useState("");

  const responder = query.data?.data;
  const skills = skillsQuery.data?.data ?? [];
  const certs = certsQuery.data?.data ?? [];
  const shifts = shiftsQuery.data?.data ?? [];
  const assignments = assignmentsQuery.data?.data ?? [];

  const verifiedCerts = certs.filter((c) => c.status === "verified").length;
  const pendingCerts = certs.filter((c) => c.status === "pending").length;

  const breadcrumbs = [
    { label: "Responders", to: "/responders" },
  ];

  if (query.isLoading) {
    return (
      <>
        <PageHeader title="Responder" breadcrumbs={breadcrumbs} />
        <LoadingState />
      </>
    );
  }

  if (query.error || !responder) {
    return (
      <>
        <PageHeader title="Responder" breadcrumbs={breadcrumbs} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    );
  }

  const label = responderLabel(responder);

  return (
    <>
      <PageMeta title={`${label} | Sentrix Console`} description="Responder detail" />

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        title={label}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RealtimeIndicator connected={connected} />
            <Can permission="responders.manage">
              <ConfirmActionButton
                label="Change status"
                title="Change responder status"
                description="Set this responder's duty status."
                confirmLabel="Update status"
                successMessage="Responder status updated"
                onOpen={() => setTargetStatus(responder.status)}
                onConfirm={() => actions.changeStatus.mutateAsync(targetStatus)}
              >
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="dark:bg-gray-900">
                      {o.label}
                    </option>
                  ))}
                </select>
              </ConfirmActionButton>
            </Can>
          </div>
        }
      />

      {/* ── KPI Summary Cards ─────────────────────────────────────────────── */}
      <div className="ic-kpi-grid mt-6">
        <KpiCard
          label="Skills"
          value={skillsQuery.isLoading ? null : skills.length}
          sub="attached"
          accent="info"
        />
        <KpiCard
          label="Certifications"
          value={certsQuery.isLoading ? null : certs.length}
          sub={
            certsQuery.isLoading
              ? undefined
              : certs.length > 0
                ? `${verifiedCerts} verified · ${pendingCerts} pending`
                : "none recorded"
          }
          accent={pendingCerts > 0 ? "warning" : verifiedCerts > 0 ? "success" : "neutral"}
        />
        <KpiCard
          label="Assignments"
          value={assignmentsQuery.isLoading ? null : assignments.length}
          sub="total participations"
          accent="neutral"
        />
        <KpiCard
          label="Duty Shifts"
          value={shiftsQuery.isLoading ? null : shifts.length}
          sub="scheduled"
          accent="info"
        />
      </div>

      {/* ── Operational Status ────────────────────────────────────────────── */}
      <div className={`mt-6 ${card}`}>
        <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
          Operational Status
        </h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-4 lg:grid-cols-5">
          <div>
            <dt className="text-theme-xs text-gray-400">On duty</dt>
            <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">
              {responder.on_duty ? "Yes" : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-400">Last seen</dt>
            <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">
              {relativeTime(responder.last_seen_at)}
            </dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-400">Last position</dt>
            <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">
              {responder.last_lat != null && responder.last_lng != null
                ? `${responder.last_lat.toFixed(4)}, ${responder.last_lng.toFixed(4)}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-400">Current assignment</dt>
            <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">
              {responder.current_assignment_id ? "Active" : "None"}
            </dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-400">Registered</dt>
            <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">
              {formatDateTime(responder.created_at)}
            </dd>
          </div>
        </dl>
      </div>

      {/* ── Skills ────────────────────────────────────────────────────────── */}
      <div className="mt-6">
        <SkillsSection responderId={id} />
      </div>

      {/* ── Certifications ────────────────────────────────────────────────── */}
      <div className="mt-6">
        <CertificationsSection responderId={id} />
      </div>

      {/* ── Assignment Participation ──────────────────────────────────────── */}
      <div className="mt-6">
        <ResponderAssignmentsPanel
          assignments={assignments}
          isLoading={assignmentsQuery.isLoading}
          error={assignmentsQuery.error}
          onRetry={() => void assignmentsQuery.refetch()}
        />
      </div>

      {/* ── Duty Shifts ───────────────────────────────────────────────────── */}
      <div className="mt-6">
        <ShiftsSection responderId={id} />
      </div>
    </>
  );
}
