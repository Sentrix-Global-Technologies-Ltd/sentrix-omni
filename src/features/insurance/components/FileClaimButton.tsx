import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { usePolicies, useInsuranceActions } from "../hooks/useInsurance";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function FileClaimButton() {
  const { fileClaim } = useInsuranceActions();
  const policiesQuery = usePolicies({});
  const policies = policiesQuery.data?.data ?? [];
  const [policyId, setPolicyId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Can permission="insurance.claims.file">
      <ConfirmActionButton
        label="File claim"
        triggerVariant="primary"
        title="File an insurance claim"
        confirmLabel="File"
        successMessage="Claim filed"
        disabled={policies.length === 0}
        onOpen={() => {
          setPolicyId(policies[0]?.id ?? "");
          setAmount("");
          setDescription("");
        }}
        onConfirm={() =>
          fileClaim.mutateAsync({
            policy_id: policyId,
            amount_cents: Math.round(Number(amount || 0) * 100),
            description: description || undefined,
          })
        }
      >
        {policies.length > 0 ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Policy</label>
              <select value={policyId} onChange={(e) => setPolicyId(e.target.value)} className={fieldClass}>
                {policies.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-gray-900">
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Amount</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Description (optional)</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} />
            </div>
          </div>
        ) : (
          <p className="text-theme-sm text-gray-500">Create a policy first, then file a claim against it.</p>
        )}
      </ConfirmActionButton>
    </Can>
  );
}
