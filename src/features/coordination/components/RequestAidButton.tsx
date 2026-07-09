import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useCommandIncidents, useCommandNodes } from "../../command/hooks/useCommand";
import { useRequestAid } from "../hooks/useCoordinationActions";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Request mutual aid from another command on a routed incident (SuperAdmin). */
export default function RequestAidButton() {
  const request = useRequestAid();
  const commandIncidents = useCommandIncidents({});
  const commands = useCommandNodes({});

  const [incidentId, setIncidentId] = useState("");
  const [requestingId, setRequestingId] = useState("");
  const [respondingId, setRespondingId] = useState("");
  const [message, setMessage] = useState("");

  const commandOptions = commands.data?.data ?? [];
  const incidentOptions = commandIncidents.data?.data ?? [];

  return (
    <Can superAdminOnly>
      <ConfirmActionButton
        label="Request aid"
        triggerVariant="primary"
        title="Request mutual aid"
        description="Ask another command to assist on a routed incident."
        confirmLabel="Request"
        successMessage="Mutual aid requested"
        onOpen={() => {
          setIncidentId("");
          setRequestingId("");
          setRespondingId("");
          setMessage("");
        }}
        onConfirm={() =>
          incidentId && requestingId && respondingId
            ? request.mutateAsync({
                command_incident_id: incidentId,
                requesting_command_id: requestingId,
                responding_command_id: respondingId,
                message: message || undefined,
              })
            : Promise.reject(new Error("Select an incident and both commands."))
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Incident</label>
            <select value={incidentId} onChange={(e) => setIncidentId(e.target.value)} className={fieldClass}>
              <option value="" className="dark:bg-gray-900">Select an incident</option>
              {incidentOptions.map((i) => (
                <option key={i.id} value={i.id} className="dark:bg-gray-900">
                  {i.summary ?? i.category} ({i.id.slice(0, 8)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Requesting command</label>
            <select value={requestingId} onChange={(e) => setRequestingId(e.target.value)} className={fieldClass}>
              <option value="" className="dark:bg-gray-900">Select a command</option>
              {commandOptions.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-gray-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Responding command</label>
            <select value={respondingId} onChange={(e) => setRespondingId(e.target.value)} className={fieldClass}>
              <option value="" className="dark:bg-gray-900">Select a command</option>
              {commandOptions.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-gray-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Message (optional)</label>
            <input value={message} onChange={(e) => setMessage(e.target.value)} className={fieldClass} />
          </div>
        </div>
      </ConfirmActionButton>
    </Can>
  );
}
