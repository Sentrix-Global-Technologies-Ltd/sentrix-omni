import { useState } from "react";
import { useNavigate } from "react-router";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useTripMutations } from "../hooks/useTrips";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Start a new trip. Navigates to the created trip on success. */
export default function CreateTripButton() {
  const { create } = useTripMutations();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [originLabel, setOriginLabel] = useState("");
  const [destinationLabel, setDestinationLabel] = useState("");
  const [expectedArrivalAt, setExpectedArrivalAt] = useState("");
  const [notes, setNotes] = useState("");
  const [destinationError, setDestinationError] = useState(false);

  const reset = () => {
    setOriginLabel("");
    setDestinationLabel("");
    setExpectedArrivalAt("");
    setNotes("");
    setDestinationError(false);
  };

  const submit = async () => {
    const trimmedDestination = destinationLabel.trim();
    if (!trimmedDestination) {
      setDestinationError(true);
      return;
    }

    try {
      const res = await create.mutateAsync({
        origin_label: originLabel.trim() || undefined,
        destination_label: trimmedDestination,
        expected_arrival_at: expectedArrivalAt ? new Date(expectedArrivalAt).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });
      setOpen(false);
      toast.success("Trip started");
      if (res.data?.id) navigate(`/trips/${res.data.id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not start the trip.");
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="primary"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        Start trip
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Start a trip</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Origin (optional)</label>
            <input
              value={originLabel}
              onChange={(e) => setOriginLabel(e.target.value)}
              placeholder="Where the trip starts"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Destination</label>
            <input
              value={destinationLabel}
              onChange={(e) => {
                setDestinationLabel(e.target.value);
                if (destinationError) setDestinationError(false);
              }}
              placeholder="Where the trip ends"
              className={`${fieldClass} ${destinationError ? "border-error-500 focus:border-error-500 focus:ring-error-500/10" : ""}`}
            />
            {destinationError && (
              <p className="mt-1 text-theme-xs text-error-500">Destination is required.</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Expected arrival (optional)</label>
            <input
              type="datetime-local"
              value={expectedArrivalAt}
              onChange={(e) => setExpectedArrivalAt(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any context responders need."
              className={`${fieldClass} h-auto py-2.5`}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Working…" : "Start trip"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
