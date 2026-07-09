import { useState, type ReactNode } from "react";
import Button from "../ui/button/Button";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./toast";
import { ApiError } from "../../services/api/errors";

interface ConfirmActionButtonProps {
  /** Trigger button label. */
  label: ReactNode;
  /** Confirmation dialog copy. */
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "primary" | "danger";
  /** Trigger button styling. */
  triggerVariant?: "primary" | "outline";
  triggerSize?: "sm" | "md";
  disabled?: boolean;
  /** Toast on success. */
  successMessage?: string;
  /** The action — typically a mutation's mutateAsync(). Must return a promise. */
  onConfirm: () => Promise<unknown>;
  /** Called when the dialog opens (e.g. reset input fields). */
  onOpen?: () => void;
  /** Optional dialog form fields (reason, target status, …). */
  children?: ReactNode;
}

/**
 * The single action pattern: a (permission-gated) trigger that opens a
 * ConfirmDialog, runs the action, and reports via toast — closing on success and
 * staying open on error. Wrap with <Can> at the call site for permission gating.
 */
export default function ConfirmActionButton({
  label,
  title,
  description,
  confirmLabel,
  tone = "primary",
  triggerVariant = "outline",
  triggerSize = "sm",
  disabled,
  successMessage,
  onConfirm,
  onOpen,
  children,
}: ConfirmActionButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleOpen = () => {
    onOpen?.();
    setOpen(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      toast.success(successMessage ?? "Done");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button size={triggerSize} variant={triggerVariant} disabled={disabled} onClick={handleOpen}>
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => (submitting ? undefined : setOpen(false))}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        tone={tone}
        loading={submitting}
        onConfirm={handleConfirm}
      >
        {children}
      </ConfirmDialog>
    </>
  );
}
