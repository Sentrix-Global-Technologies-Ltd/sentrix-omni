import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useRideActions } from "../hooks/useRidesOpsActions";
import type { OpsRide } from "../api/ridesops.types";

const fieldClass =
  "h-24 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Per-row ride actions (SuperAdmin-gated). */
export default function RideActions({ ride }: { ride: OpsRide }) {
  const a = useRideActions(ride.id);
  const [reason, setReason] = useState("");
  const [driver, setDriver] = useState("");
  const terminal = ride.status === "completed" || ride.status === "cancelled";

  if (terminal) return null;

  return (
    <Can superAdminOnly>
      <div className="flex flex-wrap justify-end gap-2">
        <ConfirmActionButton
          label="Reassign"
          title="Reassign ride?"
          description="Reassign this ride to a different driver."
          confirmLabel="Reassign"
          successMessage="Ride reassigned"
          onOpen={() => setDriver("")}
          onConfirm={() => a.reassign.mutateAsync(driver || undefined)}
        >
          <input
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
            placeholder="Driver name (optional — auto-match if blank)"
            className={inputClass}
          />
        </ConfirmActionButton>
        <ConfirmActionButton
          label="Escalate"
          title="Escalate ride to safety?"
          description="Raise this ride to the safety team. Add context if helpful."
          confirmLabel="Escalate"
          successMessage="Ride escalated"
          onOpen={() => setReason("")}
          onConfirm={() => a.escalate.mutateAsync(reason || undefined)}
        >
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className={fieldClass}
          />
        </ConfirmActionButton>
        <ConfirmActionButton
          label="Cancel"
          tone="danger"
          title="Force-cancel ride?"
          description="Cancel this ride on behalf of operations. The rider and driver are notified."
          confirmLabel="Force-cancel"
          successMessage="Ride cancelled"
          onOpen={() => setReason("")}
          onConfirm={() => a.cancel.mutateAsync(reason || undefined)}
        >
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className={fieldClass}
          />
        </ConfirmActionButton>
      </div>
    </Can>
  );
}
