import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import SecretRevealDialog from "../../../components/shared/SecretRevealDialog";
import { useToast } from "../../../components/shared/toast";
import { useOrganization } from "../../../context/OrganizationContext";
import { useOnboardBridge } from "../hooks/useSiteBridgeActions";
import { userMessage } from "../../../services/api/errors";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/**
 * Onboard a Site Bridge: a machine credential (a generated key) that
 * authenticates inbound camera-feed ingest for this org's already-installed
 * CCTV/NVR hardware — either a Sentrix-provided relay process or the
 * organization's own NVR configured to push directly. There is no separate
 * downloadable "desktop agent" application; whatever is on-site just needs
 * this key. Reveals the one-time key on success. Mirrors OnboardSourceButton
 * (Ledger) exactly.
 */
export default function OnboardBridgeButton() {
  const { activeId } = useOrganization();
  const onboard = useOnboardBridge();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [secret, setSecret] = useState<string | null>(null);

  const submit = async () => {
    try {
      const res = await onboard.mutateAsync({ label });
      setOpen(false);
      setSecret(res.data.bridge_key);
    } catch (e) {
      toast.error(userMessage(e, "Could not onboard bridge."));
    }
  };

  return (
    <Can permission="bridges.manage">
      <span title={activeId ? undefined : "Select an organization first — Site Bridges belong to one org."}>
        <Button
          size="sm"
          variant="primary"
          disabled={!activeId}
          onClick={() => {
            setLabel("");
            setOpen(true);
          }}
        >
          Onboard bridge
        </Button>
      </span>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Onboard a Site Bridge</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Give it a name for the site it covers (e.g. "Building A — front lobby"). This generates a
          one-time key — whatever's on site (a Sentrix relay, or your own NVR configured to push
          directly) authenticates with it. No separate app to install.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={fieldClass} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={onboard.isPending}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={() => void submit()} disabled={onboard.isPending || !label}>
            {onboard.isPending ? "Working…" : "Create"}
          </Button>
        </div>
      </Modal>

      <SecretRevealDialog
        open={secret !== null}
        onClose={() => setSecret(null)}
        title="Site Bridge onboarded"
        secret={secret ?? ""}
        description={`Store the bridge key for "${label}" now.`}
      />
    </Can>
  );
}
