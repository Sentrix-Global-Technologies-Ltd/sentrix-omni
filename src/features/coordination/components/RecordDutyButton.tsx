import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useRecordDuty } from "../hooks/useCoordinationActions";
import { DUTY_ACTION_OPTIONS, DUTY_SCOPE_OPTIONS } from "./coordinationTone";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Record a duty-book entry: sign in / sign out / handover. */
export default function RecordDutyButton() {
  const record = useRecordDuty();
  const [action, setAction] = useState("sign_in");
  const [scopeType, setScopeType] = useState("center");
  const [scopeId, setScopeId] = useState("");
  const [personName, setPersonName] = useState("");
  const [role, setRole] = useState("");

  return (
    <Can superAdminOnly>
      <ConfirmActionButton
        label="Record entry"
        triggerVariant="primary"
        title="Record a duty-book entry"
        confirmLabel="Record"
        successMessage="Duty entry recorded"
        onOpen={() => {
          setAction("sign_in");
          setScopeType("center");
          setScopeId("");
          setPersonName("");
          setRole("");
        }}
        onConfirm={() =>
          scopeId && personName
            ? record.mutateAsync({
                action,
                scope_type: scopeType,
                scope_id: scopeId,
                person_name: personName,
                role: role || undefined,
              })
            : Promise.reject(new Error("A scope and person name are required."))
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Person</label>
            <input value={personName} onChange={(e) => setPersonName(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Role (optional)</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} className={fieldClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Scope</label>
              <select value={scopeType} onChange={(e) => setScopeType(e.target.value)} className={fieldClass}>
                {DUTY_SCOPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="dark:bg-gray-900">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Action</label>
              <select value={action} onChange={(e) => setAction(e.target.value)} className={fieldClass}>
                {DUTY_ACTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="dark:bg-gray-900">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Scope ID</label>
            <input value={scopeId} onChange={(e) => setScopeId(e.target.value)} className={fieldClass} />
          </div>
        </div>
      </ConfirmActionButton>
    </Can>
  );
}
