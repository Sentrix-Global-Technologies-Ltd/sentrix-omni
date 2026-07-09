import { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";

interface SecretRevealDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  secret: string;
  description?: string;
}

/** One-time secret reveal (ingest keys, tokens) with copy-to-clipboard. */
export default function SecretRevealDialog({
  open,
  onClose,
  title,
  secret,
  description,
}: SecretRevealDialogProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable (insecure context) — the value is visible.
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      {description && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>}

      <div className="mt-4 rounded-lg border border-warning-300 bg-warning-50 p-3 dark:border-warning-500/30 dark:bg-warning-500/10">
        <p className="text-theme-xs font-medium text-warning-700 dark:text-orange-400">
          Copy this now — it will not be shown again.
        </p>
        <code className="mt-2 block break-all rounded bg-white px-3 py-2 font-mono text-theme-sm text-gray-800 dark:bg-gray-900 dark:text-white/90">
          {secret}
        </code>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={copy}>
          {copied ? "Copied ✓" : "Copy"}
        </Button>
        <Button size="sm" variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
