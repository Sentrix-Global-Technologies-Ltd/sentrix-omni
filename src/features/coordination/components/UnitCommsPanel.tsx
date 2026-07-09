import { useState } from "react";
import Button from "../../../components/ui/button/Button";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import LoadingState from "../../../components/ui/state/LoadingState";
import Can from "../../../components/shared/Can";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useUnits } from "../../command/hooks/useCommand";
import { useUnitThread } from "../hooks/useCoordination";
import { useSendUnitMessage } from "../hooks/useCoordinationActions";
import { formatDateTime } from "./coordinationTone";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/**
 * CAD-to-radio / MDT comms: pick a unit, read its thread, send a message.
 * Distinct from Access/Command tables — this is a two-pane panel (selector +
 * thread), not a DataTable, since a message thread is inherently a list of
 * dated bubbles rather than tabular rows.
 */
export default function UnitCommsPanel() {
  const units = useUnits({}, true);
  const [unitId, setUnitId] = useState("");
  const [body, setBody] = useState("");
  const toast = useToast();

  const thread = useUnitThread(unitId, {});
  const send = useSendUnitMessage(unitId);

  const unitOptions = units.data?.data ?? [];
  const messages = thread.data?.data ?? [];

  const handleSend = async () => {
    if (!body.trim()) return;
    try {
      await send.mutateAsync({ body: body.trim() });
      setBody("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send message.");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <label className="mb-1 block text-theme-xs text-gray-400">Unit</label>
        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className={fieldClass}
          disabled={units.isLoading}
        >
          <option value="" className="dark:bg-gray-900">
            {units.isLoading ? "Loading units…" : "Select a unit"}
          </option>
          {unitOptions.map((u) => (
            <option key={u.id} value={u.id} className="dark:bg-gray-900">
              {u.call_sign} ({u.status})
            </option>
          ))}
        </select>
      </div>

      {!unitId && (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Select a unit to view its comms thread.
        </p>
      )}

      {unitId && thread.isLoading && <LoadingState label="Loading thread…" />}

      {unitId && !thread.isLoading && (
        <div className="mb-4 max-h-96 space-y-2 overflow-y-auto">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No messages yet.</p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-lg p-3 text-sm ${
                m.direction === "unit_to_dispatch"
                  ? "ml-0 bg-gray-100 dark:bg-white/[0.05]"
                  : "ml-auto bg-brand-50 dark:bg-brand-500/10"
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <StatusBadge tone={m.direction === "unit_to_dispatch" ? "info" : "light"}>
                  {m.direction === "unit_to_dispatch" ? "Unit → Dispatch" : "Dispatch → Unit"}
                </StatusBadge>
                <span className="text-theme-xs text-gray-400">{formatDateTime(m.created_at)}</span>
              </div>
              <p className="text-gray-700 dark:text-gray-200">{m.body}</p>
            </div>
          ))}
        </div>
      )}

      {unitId && (
        <Can superAdminOnly>
          <div className="flex gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Send a message to this unit…"
              className={fieldClass}
            />
            <Button size="sm" onClick={() => void handleSend()} disabled={send.isPending || !body.trim()}>
              Send
            </Button>
          </div>
        </Can>
      )}
    </div>
  );
}
