import { useMemo, useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useAssignmentActions, useAssignmentRecommendations } from "../hooks/useAssignmentActions";
import { useResponders } from "../../responders/hooks/useResponders";
import { relativeTime, responderLabel } from "../../responders/components/responderTone";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Offer (dispatch) a responder to this assignment. */
export default function AddResponderAction({ assignmentId }: { assignmentId: string }) {
  const actions = useAssignmentActions(assignmentId);
  const respondersQuery = useResponders({ status: "available" });
  const recommendationsQuery = useAssignmentRecommendations(assignmentId);
  const [responderId, setResponderId] = useState("");
  const [role, setRole] = useState("primary");

  const candidates = recommendationsQuery.data?.data?.candidates;
  const hasCoordinates = recommendationsQuery.data?.data?.has_coordinates ?? false;

  // Ranked by DispatchRecommender: real proximity to the incident (PostGIS
  // distance) when it has coordinates, otherwise presence recency — the
  // backend picks the heuristic, not the client. Already excludes responders
  // offered on this assignment. Falls back to a local recency sort only
  // while the ranked list is still in flight.
  const responders = useMemo(() => {
    const available = respondersQuery.data?.data ?? [];

    if (!candidates) {
      return [...available].sort((a, b) => {
        const at = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const bt = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return bt - at;
      });
    }

    const order = new Map(candidates.map((c, i) => [c.responder_id, i]));
    return [...available]
      .filter((r) => order.has(r.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }, [respondersQuery.data, candidates]);

  const distanceById = useMemo(
    () => new Map((candidates ?? []).map((c) => [c.responder_id, c.distance_meters])),
    [candidates],
  );

  const describe = (r: (typeof responders)[number]): string => {
    const distance = hasCoordinates ? distanceById.get(r.id) : null;
    if (distance != null) {
      return `${(distance / 1000).toFixed(1)} km from incident`;
    }
    return `last active ${relativeTime(r.last_seen_at)}`;
  };

  return (
    <Can permission="assignments.dispatch">
      <ConfirmActionButton
        label="Add responder"
        triggerVariant="primary"
        title="Offer a responder"
        description="Dispatch this assignment to an available responder."
        confirmLabel="Send offer"
        successMessage="Responder offered"
        disabled={responders.length === 0}
        onOpen={() => {
          setResponderId(responders[0]?.id ?? "");
          setRole("primary");
        }}
        onConfirm={() => actions.addResponder.mutateAsync({ responderId, role })}
      >
        {responders.length > 0 ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Responder</label>
              <select
                value={responderId}
                onChange={(e) => setResponderId(e.target.value)}
                className={fieldClass}
              >
                {responders.map((r) => (
                  <option key={r.id} value={r.id} className="dark:bg-gray-900">
                    {responderLabel(r)} — {describe(r)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className={fieldClass}>
                <option value="primary" className="dark:bg-gray-900">Primary</option>
                <option value="supporting" className="dark:bg-gray-900">Supporting</option>
              </select>
            </div>
          </div>
        ) : (
          <p className="text-theme-sm text-gray-500">
            No available responders right now. Free up a responder, then offer again.
          </p>
        )}
      </ConfirmActionButton>
    </Can>
  );
}
