import { useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import LoadingState from "../../../components/ui/state/LoadingState";
import ErrorState from "../../../components/ui/state/ErrorState";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import TripActions from "../components/TripActions";
import { formatDateTime, titleCase, tripStatusTone } from "../components/tripTone";
import { useTrip } from "../hooks/useTrips";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

export default function TripDetailPage() {
  const { id = "" } = useParams();
  const query = useTrip(id);
  const trip = query.data?.data;

  const breadcrumbs = [{ label: "Trips", to: "/trips" }, { label: trip ? `Trip ${id.slice(0, 8)}` : "Detail" }];

  if (query.isLoading) {
    return (
      <>
        <PageHeader title="Trip" breadcrumbs={breadcrumbs} />
        <LoadingState />
      </>
    );
  }
  if (query.error || !trip) {
    return (
      <>
        <PageHeader title="Trip" breadcrumbs={breadcrumbs} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    );
  }

  return (
    <>
      <PageMeta title={`Trip ${id.slice(0, 8)} | Sentrix Console`} description="Trip detail" />
      <PageHeader
        title={`Trip ${id.slice(0, 8)}`}
        breadcrumbs={breadcrumbs}
        actions={<StatusBadge tone={tripStatusTone(trip.status)}>{titleCase(trip.status)}</StatusBadge>}
      />

      <div className="mb-6">
        <TripActions trip={trip} />
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-6">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Route</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Origin</dt>
                <dd className="text-gray-700 dark:text-gray-300">{trip.origin.label ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Destination</dt>
                <dd className="text-gray-700 dark:text-gray-300">{trip.destination.label ?? "—"}</dd>
              </div>
              {trip.notes && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-400">Notes</dt>
                  <dd className="text-gray-700 dark:text-gray-300">{trip.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        <div className="col-span-12 xl:col-span-6">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Timeline</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Started</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(trip.started_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Expected arrival</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(trip.expected_arrival_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Completed</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(trip.completed_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Cancelled</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(trip.cancelled_at)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}
