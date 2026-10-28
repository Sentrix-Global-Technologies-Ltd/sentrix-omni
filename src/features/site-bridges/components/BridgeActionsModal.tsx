import { useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "../../../icons";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";
import SecretRevealDialog from "../../../components/shared/SecretRevealDialog";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useSiteBridgeActions } from "../hooks/useSiteBridgeActions";
import type { CameraBridge } from "../api/site-bridges.types";

interface Props {
  bridge: CameraBridge;
  open: boolean;
  onClose: () => void;
}

/**
 * Modal panel for per-bridge lifecycle actions.
 * Opened by the three-dots trigger in BridgeTable.
 */
export default function BridgeActionsModal({ bridge, open, onClose }: Props) {
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
      onClose();
      setSecret(res.data.bridge_key);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not rotate key.");
    } finally {
      setRotating(false);
    }
  };

  if (!open) return null;

  const content = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        style={{ zIndex: 9998 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900"
        style={{ zIndex: 9999 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Actions for ${bridge.label}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="font-semibold text-gray-800 dark:text-white/90">{bridge.label}</p>
            <p className="mt-0.5 text-xs text-gray-400 capitalize">{bridge.status} · {bridge.health}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-white/70 transition-colors"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        {/* Actions */}
        <Can permission="bridges.manage">
          <div className="flex flex-col gap-2">
            {bridge.status !== "revoked" && (
              <button
                type="button"
                onClick={() => { onClose(); setRotateOpen(true); }}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5 transition-colors"
              >
                Rotate key
              </button>
            )}

            {bridge.status !== "active" && bridge.status !== "revoked" && (
              <ConfirmActionButton
                label="Activate"
                triggerVariant="primary"
                title="Activate bridge?"
                description={`Activate "${bridge.label}". It will accept ingest authenticated with its key.`}
                confirmLabel="Activate"
                successMessage="Bridge activated"
                onConfirm={async () => { await a.activate.mutateAsync(); onClose(); }}
              />
            )}

            {bridge.status === "active" && (
              <ConfirmActionButton
                label="Suspend"
                title="Suspend bridge?"
                description={`Suspend "${bridge.label}". Ingest will be rejected until re-activated.`}
                confirmLabel="Suspend"
                successMessage="Bridge suspended"
                onConfirm={async () => { await a.suspend.mutateAsync(); onClose(); }}
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
                onConfirm={async () => { await a.revoke.mutateAsync(); onClose(); }}
              />
            )}
          </div>
        </Can>
      </div>
    </>
  );

  return (
    <>
      {createPortal(content, document.body)}

      {/* Key rotation confirm — rendered outside the modal so it stacks correctly */}
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
    </>
  );
}
