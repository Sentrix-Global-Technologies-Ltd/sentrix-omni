import { useParams, Link } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import LoadingState from "../../../components/ui/state/LoadingState";
import ErrorState from "../../../components/ui/state/ErrorState";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import AssignmentRespondersPanel from "../components/AssignmentRespondersPanel";
import { useAssignment } from "../hooks/useAssignment";
import { useAssignmentsRealtime } from "../hooks/useAssignmentsRealtime";
import { useAssignmentActions } from "../hooks/useAssignmentActions";
import {
  assignmentStatusTone,
  formatDateTime,
  humanize,
} from "../components/assignmentTone";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

export default function AssignmentDetailPage() {
  const { id = "" } = useParams();
  const { connected } = useAssignmentsRealtime();
  const query = useAssignment(id);
  const actions = useAssignmentActions(id);
  const assignment = query.data?.data;

  const label = `Assignment ${id.slice(0, 8)}`;
  const breadcrumbs = [{ label: "Assignments", to: "/assignments" }, { label }];

  if (query.isLoading) {
    return (
      <>
        <PageHeader title="Assignment" breadcrumbs={breadcrumbs} />
        <LoadingState />
      </>
    );
  }

  if (query.error || !assignment) {
    return (
      <>
        <PageHeader title="Assignment" breadcrumbs={breadcrumbs} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    );
  }

  return (
    <>
      <PageMeta title={`${label} | Sentrix Console`} description="Assignment detail" />
      <PageHeader
        title={label}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={assignmentStatusTone[assignment.status]}>
              {humanize(assignment.status)}
            </StatusBadge>
            <RealtimeIndicator connected={connected} />
          </div>
        }
      />

      {!["completed", "cancelled"].includes(assignment.status) && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Can permission="assignments.dispatch">
            <ConfirmActionButton
              label="Mark complete"
              title="Complete assignment?"
              description="Mark this assignment as completed."
              confirmLabel="Complete"
              successMessage="Assignment completed"
              onConfirm={() => actions.complete.mutateAsync()}
            />
          </Can>
          <Can permission="assignments.cancel">
            <ConfirmActionButton
              label="Cancel"
              tone="danger"
              title="Cancel assignment?"
              description="Cancelling stands down this dispatch and its responders."
              confirmLabel="Cancel assignment"
              successMessage="Assignment cancelled"
              onConfirm={() => actions.cancel.mutateAsync()}
            />
          </Can>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-4">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Dispatch</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Mode</dt>
                <dd className="text-gray-700 dark:text-gray-300">{assignment.dispatch_mode ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Required (primary)</dt>
                <dd className="text-gray-700 dark:text-gray-300">{assignment.required_primary}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Required (supporting)</dt>
                <dd className="text-gray-700 dark:text-gray-300">{assignment.required_supporting}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Escalation level</dt>
                <dd className="text-gray-700 dark:text-gray-300">L{assignment.escalation_level}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Acceptance deadline</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(assignment.acceptance_deadline_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Incident</dt>
                <dd>
                  {assignment.incident_id ? (
                    <Link
                      to={`/incidents/${assignment.incident_id}`}
                      className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      {assignment.incident_id.slice(0, 8)}
                    </Link>
                  ) : (
                    <span className="text-gray-700 dark:text-gray-300">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-8">
          <AssignmentRespondersPanel assignmentId={id} responders={assignment.responders ?? []} />
        </div>
      </div>
    </>
  );
}
