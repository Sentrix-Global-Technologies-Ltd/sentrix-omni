import { Link } from "react-router";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { useRosterActions } from "../hooks/useRoster";
import { responderLabel } from "../../responders/components/responderTone";
import { formatDateTime } from "../../../lib/format";
import type { Tone } from "../../../components/ui/tone";
import type { Responder } from "../../responders/api/responders.types";
import type { DutyShift } from "../../responders/api/profile.types";

const shiftTone: Record<string, Tone> = {
  scheduled: "primary",
  active: "success",
  completed: "warning",
  cancelled: "error",
};

interface Props {
  entry: { shift: DutyShift; responder: Responder } | null;
  onClose: () => void;
}

/** Detail popover for a clicked roster shift, with a remove action. */
export default function ShiftDetailModal({ entry, onClose }: Props) {
  const { remove } = useRosterActions();

  if (!entry) return null;
  const { shift, responder } = entry;

  return (
    <Modal isOpen onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-sm p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Duty shift</h3>
        <StatusBadge tone={shiftTone[shift.status] ?? "light"}>{shift.status}</StatusBadge>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-gray-400">Responder</dt>
          <dd>
            <Link to={`/responders/${responder.id}`} className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
              {responderLabel(responder)}
            </Link>
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-400">Starts</dt>
          <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(shift.starts_at)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-400">Ends</dt>
          <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(shift.ends_at)}</dd>
        </div>
      </dl>
      <div className="mt-6 flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={onClose}>
          Close
        </Button>
        <Can permission="schedules.manage">
          <ConfirmActionButton
            label="Remove shift"
            tone="danger"
            title="Remove this shift?"
            confirmLabel="Remove"
            successMessage="Shift removed"
            onConfirm={() => remove.mutateAsync({ responderId: responder.id, shiftId: shift.id }).then(onClose)}
          />
        </Can>
      </div>
    </Modal>
  );
}
