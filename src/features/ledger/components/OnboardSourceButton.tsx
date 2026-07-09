import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import SecretRevealDialog from "../../../components/shared/SecretRevealDialog";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useLedgerOnboard } from "../hooks/useLedgerActions";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const KINDS = ["integration", "product", "service", "device"];

/** Onboard a ledger source; reveals the one-time ingest key on success. */
export default function OnboardSourceButton() {
  const onboard = useLedgerOnboard();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("integration");
  const [product, setProduct] = useState("");
  const [secret, setSecret] = useState<string | null>(null);

  const submit = async () => {
    try {
      const res = await onboard.mutateAsync({ name, kind, product: product || undefined });
      setOpen(false);
      setSecret(res.data.ingest_key);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not onboard source.");
    }
  };

  return (
    <Can superAdminOnly>
      <Button
        size="sm"
        variant="primary"
        onClick={() => {
          setName("");
          setKind("integration");
          setProduct("");
          setOpen(true);
        }}
      >
        Onboard source
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Onboard a ledger source</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Kind</label>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={fieldClass}>
              {KINDS.map((k) => (
                <option key={k} value={k} className="dark:bg-gray-900">
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Product (optional)</label>
            <input value={product} onChange={(e) => setProduct(e.target.value)} className={fieldClass} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={onboard.isPending}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={submit} disabled={onboard.isPending || !name}>
            {onboard.isPending ? "Working…" : "Create"}
          </Button>
        </div>
      </Modal>

      <SecretRevealDialog
        open={secret !== null}
        onClose={() => setSecret(null)}
        title="Source onboarded"
        secret={secret ?? ""}
        description={`Store the ingest key for "${name}" now.`}
      />
    </Can>
  );
}
