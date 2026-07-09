import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useDriverActions } from "../hooks/useRidesOpsActions";
import type { OpsDriver } from "../api/ridesops.types";

const fieldClass =
  "h-24 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Per-row driver actions (SuperAdmin-gated). */
export default function DriverActions({ driver }: { driver: OpsDriver }) {
  const a = useDriverActions(driver.id);
  const [reason, setReason] = useState("");
  const suspended = driver.stage === "suspended";

  return (
    <Can superAdminOnly>
      <div className="flex flex-wrap justify-end gap-2">
        {suspended ? (
          <ConfirmActionButton
            label="Reinstate"
            triggerVariant="primary"
            title="Reinstate driver?"
            description="Restore this driver to active status."
            confirmLabel="Reinstate"
            successMessage="Driver reinstated"
            onConfirm={() => a.reinstate.mutateAsync()}
          />
        ) : (
          <ConfirmActionButton
            label="Suspend"
            tone="danger"
            title="Suspend driver?"
            description="Suspend this driver from the platform. They cannot accept rides while suspended."
            confirmLabel="Suspend"
            successMessage="Driver suspended"
            onOpen={() => setReason("")}
            onConfirm={() => a.suspend.mutateAsync(reason || undefined)}
          >
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              className={fieldClass}
            />
          </ConfirmActionButton>
        )}
      </div>
    </Can>
  );
}
