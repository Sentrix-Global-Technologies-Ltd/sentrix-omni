import { useMemo, useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useCommandIncidentActions } from "../hooks/useCommandActions";
import { useClosestUnits, useUnits } from "../hooks/useCommand";
import { ACT_OPTIONS } from "./commandTone";
import type { CmdIncident } from "../api/command.types";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Per-row command-incident action (SuperAdmin-gated). */
export default function CommandIncidentActions({ incident }: { incident: CmdIncident }) {
  const a = useCommandIncidentActions(incident.id);
  const [action, setAction] = useState("acknowledge");
  const [unitId, setUnitId] = useState("");
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const terminal = incident.status === "resolved" || incident.status === "stood_down";

  // Nearby units are the primary source for the picker; fall back to the full
  // unit list when there are no ranked candidates for this incident.
  const closest = useClosestUnits(incident.id, undefined, dispatchOpen);
  const closestUnits = useMemo(() => closest.data?.data ?? [], [closest.data]);
  const fallbackUnits = useUnits({}, dispatchOpen && closest.isSuccess && closestUnits.length === 0);

  const unitOptions = useMemo(() => {
    if (closestUnits.length > 0) {
      return closestUnits.map((c) => ({
        value: c.unit.id,
        label: `${c.unit.call_sign} — ${c.distance_km.toFixed(1)}km, score ${c.score}`,
      }));
    }
    return (fallbackUnits.data?.data ?? []).map((u) => ({
      value: u.id,
      label: `${u.call_sign} (${u.status})`,
    }));
  }, [closestUnits, fallbackUnits.data]);

  if (terminal) return null;

  return (
    <Can superAdminOnly>
      <div className="flex justify-end gap-2">
        <ConfirmActionButton
          label="Dispatch unit"
          triggerVariant="outline"
          title="Dispatch a unit"
          description="Assign a field unit to respond to this incident. This dispatches a real unit."
          confirmLabel="Dispatch"
          successMessage="Unit dispatched"
          disabled={false}
          onOpen={() => {
            setUnitId("");
            setDispatchOpen(true);
          }}
          onConfirm={() =>
            unitId ? a.dispatch.mutateAsync(unitId) : Promise.reject(new Error("Select a unit to dispatch."))
          }
        >
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className={selectClass}
            disabled={closest.isLoading || fallbackUnits.isLoading}
          >
            <option value="" className="dark:bg-gray-900">
              {closest.isLoading || fallbackUnits.isLoading ? "Loading units…" : "Select a unit"}
            </option>
            {unitOptions.map((o) => (
              <option key={o.value} value={o.value} className="dark:bg-gray-900">
                {o.label}
              </option>
            ))}
          </select>
        </ConfirmActionButton>
        <ConfirmActionButton
          label="Act"
          triggerVariant="primary"
          title="Act on command incident"
          description="Advance or update this incident's dispatch state."
          confirmLabel="Apply"
          successMessage="Incident updated"
          onOpen={() => setAction("acknowledge")}
          onConfirm={() => a.act.mutateAsync(action)}
        >
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className={selectClass}
          >
            {ACT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="dark:bg-gray-900">
                {o.label}
              </option>
            ))}
          </select>
        </ConfirmActionButton>
      </div>
    </Can>
  );
}
