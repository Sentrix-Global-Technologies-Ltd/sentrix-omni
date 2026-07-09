import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useCreateCommand } from "../hooks/useCommandActions";
import { useAgencies } from "../hooks/useCommand";
import { TIER_OPTIONS } from "./commandTone";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function CreateCommandButton() {
  const create = useCreateCommand();
  const agenciesQuery = useAgencies({});
  const agencies = agenciesQuery.data?.data ?? [];
  const [agencyId, setAgencyId] = useState("");
  const [tier, setTier] = useState("state");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");

  return (
    <Can superAdminOnly>
      <ConfirmActionButton
        label="New command"
        triggerVariant="primary"
        title="Create command unit"
        confirmLabel="Create"
        successMessage="Command created"
        disabled={agencies.length === 0}
        onOpen={() => {
          setAgencyId(agencies[0]?.id ?? "");
          setTier("state");
          setName("");
          setArea("");
        }}
        onConfirm={() => create.mutateAsync({ agency_id: agencyId, tier, name, area: area || undefined })}
      >
        {agencies.length > 0 ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Agency</label>
              <select value={agencyId} onChange={(e) => setAgencyId(e.target.value)} className={fieldClass}>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id} className="dark:bg-gray-900">
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)} className={fieldClass}>
                {TIER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="dark:bg-gray-900">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Area (optional)</label>
              <input value={area} onChange={(e) => setArea(e.target.value)} className={fieldClass} />
            </div>
          </div>
        ) : (
          <p className="text-theme-sm text-gray-500">Create an agency first, then add command units under it.</p>
        )}
      </ConfirmActionButton>
    </Can>
  );
}
