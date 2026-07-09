import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useRosterActions } from "../hooks/useRoster";
import { responderLabel } from "../../responders/components/responderTone";
import type { Responder } from "../../responders/api/responders.types";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Schedule a duty shift for any responder (roster-wide — not scoped to one responder's page). */
export default function ScheduleShiftButton({ responders }: { responders: Responder[] }) {
  const { schedule } = useRosterActions();
  const [responderId, setResponderId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  return (
    <Can permission="schedules.manage">
      <ConfirmActionButton
        label="Schedule shift"
        triggerVariant="primary"
        title="Schedule a duty shift"
        confirmLabel="Schedule"
        successMessage="Shift scheduled"
        disabled={responders.length === 0}
        onOpen={() => {
          setResponderId(responders[0]?.id ?? "");
          setStart("");
          setEnd("");
        }}
        onConfirm={() => schedule.mutateAsync({ responderId, starts_at: start, ends_at: end })}
      >
        {responders.length > 0 ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Responder</label>
              <select value={responderId} onChange={(e) => setResponderId(e.target.value)} className={fieldClass}>
                {responders.map((r) => (
                  <option key={r.id} value={r.id} className="dark:bg-gray-900">
                    {responderLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Starts</label>
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Ends</label>
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className={fieldClass} />
            </div>
          </div>
        ) : (
          <p className="text-theme-sm text-gray-500">No responders on the roster yet.</p>
        )}
      </ConfirmActionButton>
    </Can>
  );
}
