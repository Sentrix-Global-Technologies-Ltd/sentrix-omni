import { useState } from "react";
import Can from "../../../components/shared/Can";
import Button from "../../../components/ui/button/Button";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";
import SecretRevealDialog from "../../../components/shared/SecretRevealDialog";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useLedgerSourceActions } from "../hooks/useLedgerActions";
import type { LedgerSource } from "../api/ledger.types";

/** Per-row source lifecycle actions (SuperAdmin-gated). */
export default function SourceActions({ source }: { source: LedgerSource }) {
  const a = useLedgerSourceActions(source.id);
  const toast = useToast();
  const [rotateOpen, setRotateOpen] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  const rotate = async () => {
    setRotating(true);
    try {
      const res = await a.rotateKey.mutateAsync();
      setRotateOpen(false);
      setSecret(res.data.ingest_key);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not rotate key.");
    } finally {
      setRotating(false);
    }
  };

  return (
    <Can superAdminOnly>
      <div className="flex flex-wrap justify-end gap-2">
        {source.status !== "revoked" && (
          <Button size="sm" variant="outline" onClick={() => setRotateOpen(true)}>
            Rotate key
          </Button>
        )}
        {source.status !== "active" && (
          <ConfirmActionButton
            label="Activate"
            triggerVariant="primary"
            title="Activate source?"
            description={`Activate "${source.name}". It will accept ingest writes.`}
            confirmLabel="Activate"
            successMessage="Source activated"
            onConfirm={() => a.activate.mutateAsync()}
          />
        )}
        {source.status === "active" && (
          <ConfirmActionButton
            label="Suspend"
            title="Suspend source?"
            description={`Suspend "${source.name}". Ingest will be rejected until re-activated.`}
            confirmLabel="Suspend"
            successMessage="Source suspended"
            onConfirm={() => a.suspend.mutateAsync()}
          />
        )}
        {source.status !== "revoked" && (
          <ConfirmActionButton
            label="Revoke"
            tone="danger"
            title="Revoke source?"
            description={`Permanently revoke "${source.name}". Its key stops working and this cannot be undone.`}
            confirmLabel="Revoke"
            successMessage="Source revoked"
            onConfirm={() => a.revoke.mutateAsync()}
          />
        )}
      </div>

      <ConfirmDialog
        open={rotateOpen}
        onClose={() => (rotating ? undefined : setRotateOpen(false))}
        title="Rotate ingest key?"
        description={`The current key for "${source.name}" stops working immediately. You'll get a new one to copy.`}
        confirmLabel="Rotate"
        tone="danger"
        loading={rotating}
        onConfirm={rotate}
      />
      <SecretRevealDialog
        open={secret !== null}
        onClose={() => setSecret(null)}
        title="New ingest key"
        secret={secret ?? ""}
        description={`Store the rotated key for "${source.name}" now.`}
      />
    </Can>
  );
}
