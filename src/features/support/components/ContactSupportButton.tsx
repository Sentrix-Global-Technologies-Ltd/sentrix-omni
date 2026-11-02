import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import FileInput from "../../../components/form/input/FileInput";
import Label from "../../../components/form/Label";
import { useToast } from "../../../components/shared/toast";
import { useOrganization } from "../../../context/OrganizationContext";
import { useSubmitSupportTicket } from "../hooks/useSupportTicketActions";
import { SUPPORT_TICKET_CATEGORY_OPTIONS } from "./supportTicketTone";
import type { SupportTicketCategory } from "../api/support.types";
import { userMessage } from "../../../services/api/errors";

const selectClass =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

/**
 * Raise a ticket with Sentrix support: a title, description, issue-type
 * category (with a free-text "Other" escape hatch), and an optional
 * screenshot. Supervisor-tier only (Supervisor/OrganizationAdmin — see
 * SupportTicketController's docblock); self-only beyond that, not an
 * internal helpdesk. Mirrors OnboardBridgeButton's modal-form shape exactly.
 */
export default function ContactSupportButton() {
  const { activeId } = useOrganization();
  const submit = useSubmitSupportTicket();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SupportTicketCategory | "">("");
  const [otherCategory, setOtherCategory] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setOtherCategory("");
    setScreenshot(null);
  };

  const isOther = category === "other";
  const canSubmit = Boolean(title && description && category && (!isOther || otherCategory));

  const doSubmit = async () => {
    if (!category) return;
    try {
      await submit.mutateAsync({
        title,
        description,
        category,
        other_category: isOther ? otherCategory : null,
        screenshot,
      });
      setOpen(false);
      reset();
      toast.success("Your message was sent to Sentrix support.");
    } catch (e) {
      toast.error(userMessage(e, "Could not submit your ticket."));
    }
  };

  return (
    <>
      <span title={activeId ? undefined : "Select an organization first."}>
        <Button
          size="sm"
          variant="primary"
          disabled={!activeId}
          onClick={() => {
            reset();
            setOpen(true);
          }}
        >
          Contact support
        </Button>
      </span>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Contact Sentrix support</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Tell us what's wrong. A screenshot helps but isn't required.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Issue type</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
              className={selectClass}
            >
              <option value="" disabled className="dark:bg-gray-900">
                Select an issue type…
              </option>
              {SUPPORT_TICKET_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="dark:bg-gray-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {isOther && (
            <div>
              <Label>Please specify</Label>
              <Input value={otherCategory} onChange={(e) => setOtherCategory(e.target.value)} />
            </div>
          )}
          <div>
            <Label>Description</Label>
            <TextArea value={description} onChange={setDescription} rows={4} />
          </div>
          <div>
            <Label>Attachment (optional)</Label>
            <FileInput onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={submit.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => void doSubmit()}
            disabled={submit.isPending || !canSubmit}
          >
            {submit.isPending ? "Sending…" : "Send"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
