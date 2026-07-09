import { useState } from "react";
import Can from "../../../components/shared/Can";
import Button from "../../../components/ui/button/Button";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";
import SecretRevealDialog from "../../../components/shared/SecretRevealDialog";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useSiteBridgeActions } from "../hooks/useSiteBridgeActions";
import type { CameraBridge } from "../api/site-bridges.types";

/** Per-row bridge lifecycle actions. Mirrors SourceActions (Ledger) exactly. */
export default function BridgeActions({ bridge }: { bridge: CameraBridge }) {
  const a = useSiteBridgeActions(bridge.id);
  const toast = useToast();
  const [rotateOpen, setRotateOpen] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  const rotate = async () => {
    setRotating(true);
    try {
      const res = await a.rotateKey.mutateAsync();
      setRotateOpen(false);
      setSecret(res.data.bridge_key);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not rotate key.");
    } finally {
      setRotating(false);
    }
  };

  return (
    <Can permission="bridges.manage">
      <div className="flex flex-wrap justify-end gap-2">
        {bridge.status !== "revoked" && (
          <Button size="sm" variant="outline" onClick={() => setRotateOpen(true)}>
            Rotate key
          </Button>
        )}
        {bridge.status !== "active" && bridge.status !== "revoked" && (
          <ConfirmActionButton
            label="Activate"
            triggerVariant="primary"
            title="Activate bridge?"
            description={`Activate "${bridge.label}". It will accept ingest from the desktop agent.`}
            confirmLabel="Activate"
            successMessage="Bridge activated"
            onConfirm={() => a.activate.mutateAsync()}
          />
        )}
        {bridge.status === "active" && (
          <ConfirmActionButton
            label="Suspend"
            title="Suspend bridge?"
            description={`Suspend "${bridge.label}". Ingest will be rejected until re-activated.`}
            confirmLabel="Suspend"
            successMessage="Bridge suspended"
            onConfirm={() => a.suspend.mutateAsync()}
          />
        )}
        {bridge.status !== "revoked" && (
          <ConfirmActionButton
            label="Revoke"
            tone="danger"
            title="Revoke bridge?"
            description={`Permanently revoke "${bridge.label}". Its key stops working and this cannot be undone.`}
            confirmLabel="Revoke"
            successMessage="Bridge revoked"
            onConfirm={() => a.revoke.mutateAsync()}
          />
        )}
      </div>

      <ConfirmDialog
        open={rotateOpen}
        onClose={() => (rotating ? undefined : setRotateOpen(false))}
        title="Rotate bridge key?"
        description={`The current key for "${bridge.label}" stops working immediately. You'll get a new one to copy.`}
        confirmLabel="Rotate"
        tone="danger"
        loading={rotating}
        onConfirm={() => void rotate()}
      />
      <SecretRevealDialog
        open={secret !== null}
        onClose={() => setSecret(null)}
        title="New bridge key"
        secret={secret ?? ""}
        description={`Store the rotated key for "${bridge.label}" now.`}
      />
    </Can>
  );
}
