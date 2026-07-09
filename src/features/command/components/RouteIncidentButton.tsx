import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useRouteIncident } from "../hooks/useCommandActions";
import { CATEGORY_OPTIONS, SEVERITY_OPTIONS } from "./commandTone";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Open (route) a new command incident (SuperAdmin). */
export default function RouteIncidentButton() {
  const route = useRouteIncident();
  const [severity, setSeverity] = useState("high");
  const [category, setCategory] = useState("crime");
  const [summary, setSummary] = useState("");

  return (
    <Can superAdminOnly>
      <ConfirmActionButton
        label="Route incident"
        triggerVariant="primary"
        title="Route a new command incident"
        description="Open and route an incident to the appropriate agency."
        confirmLabel="Route"
        successMessage="Incident routed"
        disabled={false}
        onOpen={() => {
          setSeverity("high");
          setCategory("crime");
          setSummary("");
        }}
        onConfirm={() =>
          route.mutateAsync({ severity, category, summary, source_type: "manual" })
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Summary</label>
            <input value={summary} onChange={(e) => setSummary(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={fieldClass}>
              {SEVERITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="dark:bg-gray-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="dark:bg-gray-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ConfirmActionButton>
    </Can>
  );
}
