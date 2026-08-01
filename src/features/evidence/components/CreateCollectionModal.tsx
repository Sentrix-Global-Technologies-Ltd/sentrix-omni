import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useEvidenceCollectionActions } from "../hooks/useEvidenceActions";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** "New Collection" — creates an empty case file (observations are added from
 * the collection's own detail view or, eventually, from the Observations tab). */
export default function CreateCollectionModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { create } = useEvidenceCollectionActions();
  const toast = useToast();

  const close = () => {
    setName("");
    setDescription("");
    onClose();
  };

  const submit = async () => {
    try {
      await create.mutateAsync({ name, description: description || undefined });
      toast.success("Collection created.");
      close();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create the collection.");
    }
  };

  return (
    <Modal isOpen={open} onClose={close} className="mx-4 w-full max-w-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">New Collection</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Group related observations into a case file.
      </p>
      <div className="mt-5 space-y-3">
        <div>
          <label className="mb-1 block text-theme-xs text-gray-400">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Case #4471 — Break-in on 5th"
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-theme-xs text-gray-400">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`${fieldClass} h-auto py-2`}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={close} disabled={create.isPending}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" onClick={() => void submit()} disabled={create.isPending || !name}>
          {create.isPending ? "Creating…" : "Create collection"}
        </Button>
      </div>
    </Modal>
  );
}
