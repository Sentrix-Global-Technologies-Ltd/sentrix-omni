import type { ReactNode } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  /** Optional form fields (e.g. a reason input, a status select). */
  children?: ReactNode;
}

/** Shared confirmation dialog (built on the template Modal). */
export default function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "primary",
  loading = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={open} onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
      <div className="mt-6 flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={loading}
          onClick={onConfirm}
          className={tone === "danger" ? "!bg-error-500 hover:!bg-error-600" : ""}
        >
          {loading ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
