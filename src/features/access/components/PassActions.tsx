import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { usePassActions } from "../hooks/useAccess";
import type { Pass } from "../api/access.types";

/** Per-row pass actions (revoke). */
export default function PassActions({ pass }: { pass: Pass }) {
  const a = usePassActions(pass.id);

  if (pass.status === "revoked") return null;

  return (
    <Can permission="passes.manage">
      <div className="flex justify-end">
        <ConfirmActionButton
          label="Revoke"
          tone="danger"
          title="Revoke pass?"
          description={`Revoke the pass for ${pass.visitor_name ?? pass.code}. It can no longer be used at the gate.`}
          confirmLabel="Revoke"
          successMessage="Pass revoked"
          onConfirm={() => a.revoke.mutateAsync()}
        />
      </div>
    </Can>
  );
}
