import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useDeviceActions } from "../hooks/useHardware";
import type { Device } from "../api/hardware.types";

/** Per-row device maintenance actions. */
export default function DeviceActions({ device }: { device: Device }) {
  const a = useDeviceActions(device.id);

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Can permission="hardware.resync">
        <ConfirmActionButton
          label="Resync"
          title="Resync device?"
          description={`Push a fresh sync to "${device.name ?? device.serial}".`}
          confirmLabel="Resync"
          successMessage="Resync requested"
          onConfirm={() => a.resync.mutateAsync()}
        />
      </Can>
      <Can permission="hardware.diagnose">
        <ConfirmActionButton
          label="Diagnose"
          title="Run diagnostics?"
          description={`Run a diagnostic check on "${device.name ?? device.serial}".`}
          confirmLabel="Diagnose"
          successMessage="Diagnostics started"
          onConfirm={() => a.diagnose.mutateAsync()}
        />
      </Can>
    </div>
  );
}
