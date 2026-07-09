import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useAuthz } from "../../../hooks/useAuthz";
import { useResponderLineActions } from "../hooks/useAssignmentActions";
import type { AssignmentResponderLine } from "../api/assignments.types";

const fieldClass =
  "h-24 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const TERMINAL = ["completed", "declined", "cancelled", "timed_out", "stood_down"];

/**
 * Lifecycle actions for a single responder line. Two independent audiences can
 * act on the same line, mirroring the backend's authorizeLine():
 *  - A dispatcher/supervisor (assignments.dispatch) acting on ANY line.
 *  - The assigned responder themselves (responders.self) acting on their OWN
 *    line only — this is what lets Abigail accept/decline her own offer
 *    instead of only ever seeing it via Joseph's dispatcher view.
 * Both variants render the same buttons; only the gate and copy differ.
 */
export default function ResponderLineActions({
  assignmentId,
  line,
}: {
  assignmentId: string;
  line: AssignmentResponderLine;
}) {
  const a = useResponderLineActions(assignmentId);
  const { principal, can } = useAuthz();
  const [reason, setReason] = useState("");

  if (TERMINAL.includes(line.status)) return null;

  const isOwnLine = principal !== null && principal.id === line.responder_user_id;
  const isSelfService = isOwnLine && can("responders.self");

  const buttons = (
    <div className="flex flex-wrap justify-end gap-2">
      {line.status === "offered" && (
        <>
          <ConfirmActionButton
            label="Accept"
            triggerVariant="primary"
            title={isSelfService ? "Accept this assignment?" : "Accept on behalf of responder?"}
            description={
              isSelfService
                ? "Confirm you're taking this assignment."
                : "Confirm this responder is taking the assignment."
            }
            confirmLabel="Accept"
            successMessage="Responder accepted"
            onConfirm={() => a.accept.mutateAsync(line.id)}
          />
          <ConfirmActionButton
            label="Decline"
            tone="danger"
            title={isSelfService ? "Decline this assignment?" : "Decline this responder?"}
            description={
              isSelfService
                ? "Decline this offer. You can note a reason."
                : "Decline the offer for this responder. You can note a reason."
            }
            confirmLabel="Decline"
            successMessage="Responder declined"
            onOpen={() => setReason("")}
            onConfirm={() => a.decline.mutateAsync({ lineId: line.id, reason: reason || undefined })}
          >
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              className={fieldClass}
            />
          </ConfirmActionButton>
        </>
      )}
      {line.status === "accepted" && (
        <ConfirmActionButton
          label="Mark en route"
          title="Mark en route?"
          description="Record that this responder is en route to the scene."
          confirmLabel="En route"
          successMessage="Marked en route"
          onConfirm={() => a.enRoute.mutateAsync(line.id)}
        />
      )}
      {line.status === "en_route" && (
        <ConfirmActionButton
          label="Mark on scene"
          title="Mark on scene?"
          description="Record that this responder has arrived on scene."
          confirmLabel="On scene"
          successMessage="Marked on scene"
          onConfirm={() => a.onScene.mutateAsync(line.id)}
        />
      )}
      {line.status === "on_scene" && (
        <ConfirmActionButton
          label="Complete"
          triggerVariant="primary"
          title="Complete this responder line?"
          description="Mark this responder's part of the assignment complete."
          confirmLabel="Complete"
          successMessage="Line completed"
          onConfirm={() => a.complete.mutateAsync(line.id)}
        />
      )}
    </div>
  );

  // Self-service: the logged-in responder acting on their own line. Rendered
  // outside <Can> since it depends on identity, not a static permission rule.
  if (isSelfService) return buttons;

  // Dispatcher/supervisor acting on someone else's line.
  return <Can permission="assignments.dispatch">{buttons}</Can>;
}
