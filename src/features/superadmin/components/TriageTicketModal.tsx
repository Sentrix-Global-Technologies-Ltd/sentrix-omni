import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import TextArea from "../../../components/form/input/TextArea";
import Label from "../../../components/form/Label";
import Can from "../../../components/shared/Can";
import { useToast } from "../../../components/shared/toast";
import { SUPPORT_TICKET_STATUS_OPTIONS } from "../../support/components/supportTicketTone";
import { useTriageSupportTicket } from "../hooks/useTriageSupportTicket";
import type { SupportTicket } from "../../support/api/support.types";

interface Props {
  ticket: SupportTicket | null;
  onClose: () => void;
}

/**
 * Ticket detail + triage form. Read-only for anyone who can only reach the
 * queue via support.tickets.view; the update controls are gated on
 * support.tickets.manage (support.tickets.manage PlatformPermission).
 */
export default function TriageTicketModal({ ticket, onClose }: Props) {
  const triage = useTriageSupportTicket();
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [assignToSelf, setAssignToSelf] = useState(false);

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setNotes(ticket.resolution_notes ?? "");
      setAssignToSelf(false);
    }
  }, [ticket]);

  if (!ticket) return null;

  const save = async () => {
    try {
      await triage.mutateAsync({
        id: ticket.id,
        payload: {
          status: status !== ticket.status ? status : undefined,
          resolution_notes: notes !== (ticket.resolution_notes ?? "") ? notes : undefined,
          assign_to_self: assignToSelf || undefined,
        },
      });
      toast.success("Ticket updated.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the ticket.");
    }
  };

  return (
    <Modal isOpen onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{ticket.title}</h3>
      <p className="mt-1 text-theme-xs text-gray-400" title={ticket.id}>
        Ref {ticket.id.slice(0, 8)}
      </p>
      <p className="mt-1 text-theme-xs text-gray-400">
        {ticket.organization?.name ?? "Unknown org"} · {ticket.submitter?.name ?? "Unknown"} (
        {ticket.submitter?.email ?? "—"}) ·{" "}
        {ticket.category === "other" ? ticket.other_category ?? "Other" : ticket.category_label}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{ticket.description}</p>
      {ticket.screenshot_url && (
        <a
          href={ticket.screenshot_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-theme-sm font-medium text-brand-500 hover:underline"
        >
          View screenshot
        </a>
      )}

      <Can
        permission="support.tickets.manage"
        fallback={
          <>
            <p className="mt-4 text-theme-xs text-gray-400">
              You can view this ticket but do not have permission to update it.
            </p>
            <div className="mt-6 flex justify-end">
              <Button size="sm" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        }
      >
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <div>
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              {SUPPORT_TICKET_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="dark:bg-gray-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Resolution notes</Label>
            <TextArea value={notes} onChange={setNotes} rows={3} />
          </div>
          <label className="flex items-center gap-2 text-theme-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={assignToSelf}
              onChange={(e) => setAssignToSelf(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Assign this ticket to me
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={onClose} disabled={triage.isPending}>
            Close
          </Button>
          <Button size="sm" variant="primary" onClick={() => void save()} disabled={triage.isPending}>
            {triage.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </Can>
    </Modal>
  );
}
