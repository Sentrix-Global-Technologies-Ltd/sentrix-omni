import { useState } from "react";
import { useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import LoadingState from "../../../components/ui/state/LoadingState";
import ErrorState from "../../../components/ui/state/ErrorState";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import Timeline, { type TimelineItem } from "../../../components/ui/timeline/Timeline";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import CreateIncidentButton from "../../incidents/components/CreateIncidentButton";
import { useEmergency } from "../hooks/useEmergency";
import { useEmergenciesRealtime } from "../hooks/useEmergenciesRealtime";
import { useEmergencyActions } from "../hooks/useEmergencyActions";
import {
  emergencyLabel,
  emergencySeverityTone,
  emergencyStatusTone,
  formatDateTime,
  titleCase,
} from "../components/emergencyTone";
import type { Emergency } from "../api/emergencies.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

function lifecycle(e: Emergency): TimelineItem[] {
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

export default function EmergencyDetailPage() {
  const { id = "" } = useParams();
  const { connected } = useEmergenciesRealtime();
  const query = useEmergency(id);
  const actions = useEmergencyActions(id);
  const [resolution, setResolution] = useState("");
  const emergency = query.data?.data;

  const label = emergency ? emergencyLabel(emergency.message, emergency.id) : "Detail";
  const breadcrumbs = [
    { label: "Emergencies", to: "/emergencies" },
    { label },
  ];

  if (query.isLoading) {
    return (
      <>
        <PageHeader title="Emergency" breadcrumbs={breadcrumbs} />
        <LoadingState />
      </>
    );
  }

  if (query.error || !emergency) {
    return (
      <>
        <PageHeader title="Emergency" breadcrumbs={breadcrumbs} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    );
  }

  const { lat, lng } = emergency.location;

  return (
    <>
      <PageMeta title={`${label} | Sentrix Console`} description="Emergency detail" />
      <PageHeader
        title={label}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={emergencyStatusTone[emergency.status]}>
              {titleCase(emergency.status)}
            </StatusBadge>
            <StatusBadge tone={emergencySeverityTone[emergency.severity]}>
              {titleCase(emergency.severity)}
            </StatusBadge>
            <RealtimeIndicator connected={connected} />
          </div>
        }
      />

      {["triggered", "acknowledged"].includes(emergency.status) && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Can permission="incidents.create">
            <CreateIncidentButton
              emergencyId={emergency.id}
              triggerLabel="Open incident"
              triggerVariant="primary"
            />
          </Can>
          {emergency.status === "triggered" && (
            <Can permission="emergencies.acknowledge">
              <ConfirmActionButton
                label="Acknowledge"
                title="Acknowledge emergency?"
                description="Confirm you are coordinating a response to this emergency."
                confirmLabel="Acknowledge"
                successMessage="Emergency acknowledged"
                onConfirm={() => actions.acknowledge.mutateAsync()}
              />
            </Can>
          )}
          <Can permission="emergencies.resolve">
            <ConfirmActionButton
              label="Resolve"
              title="Resolve emergency?"
              description="Mark this emergency resolved. You may add a resolution note."
              confirmLabel="Resolve"
              successMessage="Emergency resolved"
              onOpen={() => setResolution("")}
              onConfirm={() => actions.resolve.mutateAsync(resolution || undefined)}
            >
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Resolution note (optional)"
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
              />
            </ConfirmActionButton>
          </Can>
          <Can permission="emergencies.resolve">
            <ConfirmActionButton
              label="Cancel"
              tone="danger"
              title="Cancel emergency?"
              description="Stand this emergency down as a false alarm or duplicate."
              confirmLabel="Cancel emergency"
              successMessage="Emergency cancelled"
              onConfirm={() => actions.cancel.mutateAsync()}
            />
          </Can>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Details</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {emergency.message || "No message provided."}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-theme-xs uppercase text-gray-400">Location</dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {lat != null && lng != null
                    ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-theme-xs uppercase text-gray-400">Linked trip</dt>
                <dd className="truncate text-gray-700 dark:text-gray-300">
                  {emergency.trip_id ? emergency.trip_id.slice(0, 8) : "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <div className={card}>
            <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Lifecycle</h3>
            <Timeline items={lifecycle(emergency)} />
          </div>
        </div>
      </div>
    </>
  );
}
