import { useState } from "react";
import { useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import LoadingState from "../../../components/ui/state/LoadingState";
import ErrorState from "../../../components/ui/state/ErrorState";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import ResponderAssignmentsPanel from "../components/ResponderAssignmentsPanel";
import ResponderProfilePanels from "../components/ResponderProfilePanels";
import { useResponder } from "../hooks/useResponder";
import { useResponderAssignments } from "../hooks/useResponderAssignments";
import { useRespondersRealtime } from "../hooks/useRespondersRealtime";
import { useResponderActions } from "../hooks/useResponderActions";
import {
  formatDateTime,
  humanize,
  relativeTime,
  responderLabel,
  responderStatusTone,
  STATUS_OPTIONS,
} from "../components/responderTone";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

export default function ResponderDetailPage() {
  const { id = "" } = useParams();
  const { connected } = useRespondersRealtime();
  const query = useResponder(id);
  const assignmentsQuery = useResponderAssignments(id);
  const actions = useResponderActions(id);
  const [targetStatus, setTargetStatus] = useState("");
  const responder = query.data?.data;

  const breadcrumbs = [
    { label: "Responders", to: "/responders" },
    { label: responder ? responderLabel(responder) : "Detail" },
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
      <PageHeader
        title={label}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={responderStatusTone[responder.status]}>
              {humanize(responder.status)}
            </StatusBadge>
            <StatusBadge tone={responder.assignable ? "success" : "light"}>
              {responder.assignable ? "Assignable" : "Not assignable"}
            </StatusBadge>
            <RealtimeIndicator connected={connected} />
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
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

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-4">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Status</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">On duty</dt>
                <dd className="text-gray-700 dark:text-gray-300">{responder.on_duty ? "Yes" : "No"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Last seen</dt>
                <dd className="text-gray-700 dark:text-gray-300">{relativeTime(responder.last_seen_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Last position</dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {responder.last_lat != null && responder.last_lng != null
                    ? `${responder.last_lat.toFixed(4)}, ${responder.last_lng.toFixed(4)}`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Current assignment</dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {responder.current_assignment_id ? "Active" : "None"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Registered</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(responder.created_at)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-8">
          <ResponderAssignmentsPanel
            assignments={assignmentsQuery.data?.data ?? []}
            isLoading={assignmentsQuery.isLoading}
            error={assignmentsQuery.error}
            onRetry={() => void assignmentsQuery.refetch()}
          />
        </div>
      </div>

      <div className="mt-6">
        <ResponderProfilePanels responderId={id} />
      </div>
    </>
  );
}
