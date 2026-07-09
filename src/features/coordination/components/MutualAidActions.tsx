import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useMutualAidActions } from "../hooks/useCoordinationActions";
import type { MutualAidRequest } from "../api/coordination.types";

/** Per-row mutual-aid accept/decline (SuperAdmin-gated). */
export default function MutualAidActions({ request }: { request: MutualAidRequest }) {
  const a = useMutualAidActions(request.id);

  if (request.status !== "requested") return null;

  return (
    <Can superAdminOnly>
      <div className="flex justify-end gap-2">
        <ConfirmActionButton
          label="Decline"
          triggerVariant="outline"
          tone="danger"
          title="Decline mutual-aid request"
          confirmLabel="Decline"
          successMessage="Request declined"
          onConfirm={() => a.decline.mutateAsync()}
        />
        <ConfirmActionButton
          label="Accept"
          triggerVariant="primary"
          title="Accept mutual-aid request"
          confirmLabel="Accept"
          successMessage="Request accepted"
          onConfirm={() => a.accept.mutateAsync()}
        />
      </div>
    </Can>
  );
}
