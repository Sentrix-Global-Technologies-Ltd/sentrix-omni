import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import SecretRevealDialog from "../../../components/shared/SecretRevealDialog";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useProvisionBridge } from "../hooks/useProvisionBridge";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/**
 * Sentrix Console (platform-staff) — onboard a Site Bridge (camera source) for
 * a client organization on their behalf, gated on hardware.provision. There is
 * no cross-tenant "browse all organizations" listing today, so the target org
 * is identified by its ID or slug (same UUID-or-slug tolerance the Core bridge
 * already uses) rather than a picker.
 */
export default function ProvisionBridgeButton() {
  const onboard = useProvisionBridge();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState("");
  const [label, setLabel] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");

  const submit = async () => {
    try {
      const res = await onboard.mutateAsync({ organization_id: organizationId, label });
      setOpen(false);
      setOrgName(res.data.organization_name);
      setSecret(res.data.bridge_key);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not provision the Site Bridge.");
    }
  };

  return (
    <Can anyPermission={["hardware.provision"]}>
      <Button
        size="sm"
        variant="primary"
        onClick={() => {
          setOrganizationId("");
          setLabel("");
          setOpen(true);
        }}
      >
        Add Camera Source for client
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Provision a Site Bridge for a client</h3>
        <p className="mt-1 text-theme-xs text-gray-400">
          Onboards a Site Bridge on the client organization's behalf. The one-time key is shown once — hand it to the
          client to configure on whatever's on site (a Sentrix relay, or their own NVR pushing directly).
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Organization ID or slug</label>
            <input
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className={fieldClass}
              placeholder="acme-security or the org's UUID"
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={fieldClass}
              placeholder="Main entrance NVR"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={onboard.isPending}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={submit} disabled={onboard.isPending || !organizationId || !label}>
            {onboard.isPending ? "Working…" : "Provision"}
          </Button>
        </div>
      </Modal>

      <SecretRevealDialog
        open={secret !== null}
        onClose={() => setSecret(null)}
        title="Site Bridge onboarded"
        secret={secret ?? ""}
        description={`Store the bridge key for ${orgName || "the client"} now — send it to them to configure on site.`}
      />
    </Can>
  );
}
