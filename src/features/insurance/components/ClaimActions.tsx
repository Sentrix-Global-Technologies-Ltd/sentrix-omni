import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useClaimActions } from "../hooks/useInsurance";
import type { Claim } from "../api/insurance.types";

const TERMINAL = ["approved", "rejected"];

/** Adjuster decision actions on a claim (approve / reject). */
export default function ClaimActions({ claim }: { claim: Claim }) {
  const a = useClaimActions(claim.id);

  if (TERMINAL.includes(claim.status)) return null;

  return (
    <Can permission="insurance.claims.adjust">
      <div className="flex flex-wrap justify-end gap-2">
        <ConfirmActionButton
          label="Approve"
          triggerVariant="primary"
          title="Approve claim?"
          description="Approve this claim for payout."
          confirmLabel="Approve"
          successMessage="Claim approved"
          onConfirm={() => a.decide.mutateAsync("approved")}
        />
        <ConfirmActionButton
          label="Reject"
          tone="danger"
          title="Reject claim?"
          description="Reject this claim."
          confirmLabel="Reject"
          successMessage="Claim rejected"
          onConfirm={() => a.decide.mutateAsync("rejected")}
        />
      </div>
    </Can>
  );
}
