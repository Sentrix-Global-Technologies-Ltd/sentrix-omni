import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useTripActions } from "../hooks/useTrips";
import type { Trip } from "../api/trips.types";
import EditTripButton from "./EditTripButton";

const TERMINAL = ["completed", "cancelled"];

/** Trip lifecycle actions (edit / complete / cancel). */
export default function TripActions({ trip }: { trip: Trip }) {
  const a = useTripActions(trip.id);

  if (TERMINAL.includes(trip.status)) return null;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Can permission="trips.update">
        <EditTripButton trip={trip} />
      </Can>
      <Can permission="trips.update">
        <ConfirmActionButton
          label="Complete"
          triggerVariant="primary"
          title="Complete trip?"
          description="Mark this trip as safely completed."
          confirmLabel="Complete"
          successMessage="Trip completed"
          onConfirm={() => a.complete.mutateAsync()}
        />
      </Can>
      <Can permission="trips.cancel">
        <ConfirmActionButton
          label="Cancel"
          tone="danger"
          title="Cancel trip?"
          description="Cancel this trip."
          confirmLabel="Cancel trip"
          successMessage="Trip cancelled"
          onConfirm={() => a.cancel.mutateAsync()}
        />
      </Can>
    </div>
  );
}
