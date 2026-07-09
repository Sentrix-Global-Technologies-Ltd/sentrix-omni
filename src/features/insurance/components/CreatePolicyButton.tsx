import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useInsuranceActions } from "../hooks/useInsurance";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function CreatePolicyButton() {
  const { createPolicy } = useInsuranceActions();
  const [title, setTitle] = useState("");
  const [premium, setPremium] = useState("");
  const [currency, setCurrency] = useState("NGN");

  return (
    <Can permission="insurance.policies.write">
      <ConfirmActionButton
        label="New policy"
        triggerVariant="primary"
        title="Create insurance policy"
        confirmLabel="Create"
        successMessage="Policy created"
        onOpen={() => {
          setTitle("");
          setPremium("");
          setCurrency("NGN");
        }}
        onConfirm={() =>
          createPolicy.mutateAsync({
            title,
            premium_cents: Math.round(Number(premium || 0) * 100),
            currency,
          })
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Premium</label>
            <input
              type="number"
              step="0.01"
              value={premium}
              onChange={(e) => setPremium(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Currency</label>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} className={fieldClass} />
          </div>
        </div>
      </ConfirmActionButton>
    </Can>
  );
}
