import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useTripActions } from "../hooks/useTrips";
import type { Trip } from "../api/trips.types";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Convert an ISO timestamp to the value shape <input type="datetime-local"> expects. */
const toDateTimeLocal = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Edit a trip's destination, expected arrival, and notes. Gate with <Can trips.update>. */
export default function EditTripButton({ trip }: { trip: Trip }) {
  const { update } = useTripActions(trip.id);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [destinationLabel, setDestinationLabel] = useState(trip.destination.label ?? "");
  const [expectedArrivalAt, setExpectedArrivalAt] = useState(toDateTimeLocal(trip.expected_arrival_at));
  const [notes, setNotes] = useState(trip.notes ?? "");

  const openModal = () => {
    setDestinationLabel(trip.destination.label ?? "");
    setExpectedArrivalAt(toDateTimeLocal(trip.expected_arrival_at));
    setNotes(trip.notes ?? "");
    setOpen(true);
  };

  const submit = async () => {
    try {
      await update.mutateAsync({
        destination_label: destinationLabel.trim() || undefined,
        expected_arrival_at: expectedArrivalAt ? new Date(expectedArrivalAt).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });
      setOpen(false);
      toast.success("Trip updated");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update the trip.");
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={openModal}>
        Edit
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Edit trip</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Destination</label>
            <input value={destinationLabel} onChange={(e) => setDestinationLabel(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Expected arrival</label>
            <input
              type="datetime-local"
              value={expectedArrivalAt}
              onChange={(e) => setExpectedArrivalAt(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${fieldClass} h-auto py-2.5`}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={update.isPending}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={submit} disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
