import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useCreateOrganization } from "../hooks/useSettingsActions";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Create a new organization; re-bootstraps so the new tenant becomes active. */
export default function CreateOrganizationButton() {
  const create = useCreateOrganization();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const submit = async () => {
    try {
      await create.mutateAsync({ name, slug: slug || undefined });
      toast.success("Organization created");
      // New tenant exists — re-bootstrap so the org list + switcher pick it up.
      window.location.assign("/");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create organization.");
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setName("");
          setSlug("");
          setOpen(true);
        }}
      >
        New organization
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Create organization</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Slug (optional)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-org"
              className={fieldClass}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={submit} disabled={create.isPending || !name}>
            {create.isPending ? "Working…" : "Create"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
