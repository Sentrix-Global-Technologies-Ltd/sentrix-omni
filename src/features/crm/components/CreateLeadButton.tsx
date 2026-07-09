import { useState } from "react";
import { useNavigate } from "react-router";
import Can from "../../../components/shared/Can";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useLeadMutations } from "../hooks/useLeadActions";
import type { ClientType } from "../api/leads.types";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const CLIENT_TYPES: ClientType[] = ["university", "estate", "company", "other"];

/** Open a new CRM lead. Navigates to the created lead on success. */
export default function CreateLeadButton() {
  const { create } = useLeadMutations();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientType, setClientType] = useState<ClientType>("company");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [region, setRegion] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setName("");
    setClientType("company");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setRegion("");
    setSource("");
    setNotes("");
  };

  const submit = async () => {
    try {
      const res = await create.mutateAsync({
        name: name.trim(),
        client_type: clientType,
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim() || undefined,
        region: region.trim() || undefined,
        source: source.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setOpen(false);
      toast.success("Lead created");
      if (res.data?.id) navigate(`/superadmin/leads/${res.data.id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create the lead.");
    }
  };

  const canSubmit = name.trim() && contactName.trim() && contactEmail.trim();

  return (
    <Can superAdminOnly>
      <Button
        size="sm"
        variant="primary"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        New lead
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Create a lead</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organization or account name"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Client type</label>
            <select value={clientType} onChange={(e) => setClientType(e.target.value as ClientType)} className={fieldClass}>
              {CLIENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Contact name</label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Primary contact"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Contact email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@example.com"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Contact phone (optional)</label>
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Region (optional)</label>
            <input value={region} onChange={(e) => setRegion(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Source (optional)</label>
            <input value={source} onChange={(e) => setSource(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any context worth capturing for onboarding."
              className={`${fieldClass} h-auto py-2.5`}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={submit} disabled={create.isPending || !canSubmit}>
            {create.isPending ? "Working…" : "Create lead"}
          </Button>
        </div>
      </Modal>
    </Can>
  );
}
