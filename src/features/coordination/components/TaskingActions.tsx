import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useTaskingActions } from "../hooks/useCoordinationActions";
import type { Tasking } from "../api/coordination.types";

/** Per-row tasking acknowledge/resolve (SuperAdmin-gated). */
export default function TaskingActions({ tasking }: { tasking: Tasking }) {
  const a = useTaskingActions(tasking.id);

  if (tasking.status === "resolved") return null;

  return (
    <Can superAdminOnly>
      <div className="flex justify-end gap-2">
        {tasking.status === "sent" && (
          <ConfirmActionButton
            label="Acknowledge"
            triggerVariant="outline"
            title="Acknowledge tasking"
            confirmLabel="Acknowledge"
            successMessage="Tasking acknowledged"
            onConfirm={() => a.acknowledge.mutateAsync()}
          />
        )}
        <ConfirmActionButton
          label="Resolve"
          triggerVariant="primary"
          title="Resolve tasking"
          confirmLabel="Resolve"
          successMessage="Tasking resolved"
          onConfirm={() => a.resolve.mutateAsync()}
        />
      </div>
    </Can>
  );
}
