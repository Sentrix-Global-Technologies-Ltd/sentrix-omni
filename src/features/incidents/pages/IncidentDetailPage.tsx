import { useState } from "react";
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
import IncidentTimelinePanel from "../components/IncidentTimelinePanel";
import IncidentAssignmentPanel from "../components/IncidentAssignmentPanel";
import EditIncidentButton from "../components/EditIncidentButton";
import OpenAssignmentButton from "../../assignments/components/OpenAssignmentButton";
import { useIncident } from "../hooks/useIncident";
import { useIncidentsRealtime } from "../hooks/useIncidentsRealtime";
import { useIncidentActions } from "../hooks/useIncidentActions";
import {
  formatDateTime,
  incidentSeverityTone,
  incidentStatusTone,
  riskTone,
  titleCase,
} from "../components/incidentTone";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

export default function IncidentDetailPage() {
  const { id = "" } = useParams();
  const { connected } = useIncidentsRealtime();
  const { principal } = useAuthz();
  const query = useIncident(id);
  const actions = useIncidentActions(id);
  const detail = query.data?.data;
  const [authoritiesNotes, setAuthoritiesNotes] = useState("");

  const breadcrumbs = [
    { label: "Incidents", to: "/incidents" },
    { label: detail?.incident.title ?? "Detail" },
  ];

  if (query.isLoading) {
    return (
      <>
        <PageHeader title="Incident" breadcrumbs={breadcrumbs} />
        <LoadingState />
      </>
    );
  }

  if (query.error || !detail) {
    return (
      <>
        <PageHeader title="Incident" breadcrumbs={breadcrumbs} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    );
  }

  const { incident, assignment, timeline } = detail;

  // Editing an incident's own details (title/severity/summary) is narrower
  // than the incidents.update permission alone — that's also held by
  // Dispatcher/Responder for workflow reasons (investigate, status view).
  // Mirrors the backend's IncidentController::assertCanEditDetails(): only
  // whoever opened the incident, or a Supervisor exercising oversight, may
  // edit it. This is a UX gate only — the backend enforces it regardless.
  const canEditDetails =
    principal !== null &&
    (principal.id === incident.opened_by || principal.roles.includes("Supervisor"));

  return (
    <>
      <PageMeta title={`${incident.title} | Sentrix Console`} description="Incident detail" />
      <PageHeader
        title={incident.title}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={incidentStatusTone[incident.status]}>
              {titleCase(incident.status)}
            </StatusBadge>
            <StatusBadge tone={incidentSeverityTone[incident.severity]}>
              {titleCase(incident.severity)}
            </StatusBadge>
            {incident.risk_score != null && (
              <StatusBadge tone={riskTone(incident.risk_score)}>Risk {incident.risk_score}</StatusBadge>
            )}
            <RealtimeIndicator connected={connected} />
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {!["resolved", "closed"].includes(incident.status) && canEditDetails && (
          <Can permission="incidents.update">
            <EditIncidentButton incident={incident} />
          </Can>
        )}
        {incident.status === "open" && (
          <Can permission="incidents.update">
            <ConfirmActionButton
              label="Start investigation"
              title="Start investigation?"
              description="Move this incident to investigating."
              confirmLabel="Start"
              successMessage="Investigation started"
              onConfirm={() => actions.investigate.mutateAsync()}
            />
          </Can>
        )}
        {["open", "investigating"].includes(incident.status) && (
          <Can permission="incidents.escalate">
            <ConfirmActionButton
              label="Escalate"
              title="Escalate incident?"
              description="Escalate this incident for higher-priority response."
              confirmLabel="Escalate"
              successMessage="Incident escalated"
              onConfirm={() => actions.escalate.mutateAsync()}
            />
          </Can>
        )}
        {incident.status !== "closed" && (
          <Can permission="incidents.notify_authorities">
            <ConfirmActionButton
              label="Notify authorities"
              tone="danger"
              title="Record that authorities were notified?"
              description="This records that you personally contacted external authorities (e.g. police, fire, or a private response provider). It does not place any call or dispatch on your behalf — no such automated integration exists."
              confirmLabel="Record"
              successMessage="Recorded"
              onOpen={() => setAuthoritiesNotes("")}
              onConfirm={() => actions.notifyAuthorities.mutateAsync(authoritiesNotes || undefined)}
            >
              <textarea
                value={authoritiesNotes}
                onChange={(e) => setAuthoritiesNotes(e.target.value)}
                placeholder="Notes — who you contacted, reference number, etc. (optional)"
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
              />
            </ConfirmActionButton>
          </Can>
        )}
        {["open", "investigating", "escalated"].includes(incident.status) && (
          <Can permission="incidents.resolve">
            <ConfirmActionButton
              label="Resolve"
              title="Resolve incident?"
              description="Mark this incident as resolved."
              confirmLabel="Resolve"
              successMessage="Incident resolved"
              onConfirm={() => actions.resolve.mutateAsync()}
            />
          </Can>
        )}
        {incident.status === "resolved" && (
          <Can permission="incidents.resolve">
            <ConfirmActionButton
              label="Close"
              tone="danger"
              title="Close incident?"
              description="Closing finalizes this incident and removes it from active work."
              confirmLabel="Close"
              successMessage="Incident closed"
              onConfirm={() => actions.close.mutateAsync()}
            />
          </Can>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-8">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Summary</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {incident.summary || "No summary provided."}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-theme-xs uppercase text-gray-400">Opened</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(incident.opened_at)}</dd>
              </div>
              <div>
                <dt className="text-theme-xs uppercase text-gray-400">Escalated</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(incident.escalated_at)}</dd>
              </div>
              <div>
                <dt className="text-theme-xs uppercase text-gray-400">Resolved</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(incident.resolved_at)}</dd>
              </div>
              <div>
                <dt className="text-theme-xs uppercase text-gray-400">Closed</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(incident.closed_at)}</dd>
              </div>
              {incident.emergency_id && (
                <div>
                  <dt className="text-theme-xs uppercase text-gray-400">Linked emergency</dt>
                  <dd className="text-gray-700 dark:text-gray-300">
                    <Link
                      to={`/emergencies/${incident.emergency_id}`}
                      className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      {incident.emergency_id.slice(0, 8)}
                    </Link>
                  </dd>
                </div>
              )}
              {incident.authorities_notified_at && (
                <div className="col-span-2 sm:col-span-4">
                  <dt className="text-theme-xs uppercase text-gray-400">Authorities notified</dt>
                  <dd className="text-gray-700 dark:text-gray-300">
                    {formatDateTime(incident.authorities_notified_at)}
                    {incident.authorities_notes && ` — ${incident.authorities_notes}`}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className={card}>
            <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Timeline</h3>
            <IncidentTimelinePanel entries={timeline} />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <IncidentAssignmentPanel
            assignment={assignment}
            action={
              !assignment && !["resolved", "closed"].includes(incident.status) ? (
                <Can permission="assignments.create">
                  <OpenAssignmentButton incidentId={incident.id} />
                </Can>
              ) : undefined
            }
          />
        </div>
      </div>
    </>
  );
}
