import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import Avatar from "../../../components/ui/avatar/Avatar";
import TextArea from "../../../components/form/input/TextArea";
import Label from "../../../components/form/Label";
import Radio from "../../../components/form/input/Radio";
import Can from "../../../components/shared/Can";
import { useToast } from "../../../components/shared/toast";
import { DocsIcon } from "../../../icons";
import { formatDateTime, humanize } from "../../../lib/format";
import { verificationStatusTone } from "./verificationStatusTone";
import { formatIdType } from "./verificationIdType";
import { useDecideVerification } from "../hooks/useDecideVerification";
import { useVerificationSelfie } from "../hooks/useVerificationSelfie";
import { useRevealIdNumber } from "../hooks/useRevealIdNumber";
import type { KycVerification } from "../api/verifications.types";

interface Props {
  verification: KycVerification | null;
  onClose: () => void;
}

const NOTE_MAX = 500;

/**
 * KYC submission detail. Read-only for anyone who can only reach the queue
 * via verifications.view. For 'manual'-driver rows still 'pending', a
 * nested Approve/Reject section is gated on the stricter
 * verifications.manage permission (mirrors TriageTicketModal's
 * support.tickets.manage split) — this is the in-house decision that
 * replaces a third-party KYC platform's automated result while
 * sentrix.verification.driver = 'manual'. korapay/smile_id rows (and
 * already-decided manual rows) show no decision controls: those are decided
 * by their own automated/legacy path, never overridden by a staff member here.
 */
export default function VerificationDetailModal({ verification, onClose }: Props) {
  const decide = useDecideVerification();
  const revealIdNumber = useRevealIdNumber();
  const toast = useToast();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [note, setNote] = useState("");
  const [revealedIdNumber, setRevealedIdNumber] = useState<string | null>(null);
  const { url: selfieUrl, status: selfieStatus } = useVerificationSelfie(
    verification?.has_selfie ? verification.id : null,
  );

  useEffect(() => {
    setDecision(null);
    setNote("");
    // Never carry a previously-revealed number over to a different row.
    setRevealedIdNumber(null);
  }, [verification?.id]);

  if (!verification) return null;

  const canDecide = verification.provider === "manual" && verification.status === "pending";
  const canSubmit = decision !== null && note.trim().length > 0 && !decide.isPending;

  const submit = async () => {
    if (decision === null) return;
    try {
      await decide.mutateAsync({ id: verification.id, payload: { decision, note } });
      toast.success(decision === "approved" ? "Verification approved." : "Verification rejected.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record the decision.");
    }
  };

  const revealNumber = async () => {
    try {
      const res = await revealIdNumber.mutateAsync(verification.id);
      setRevealedIdNumber(res.data.id_number);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reveal the full ID number.");
    }
  };

  return (
    <Modal isOpen onClose={onClose} className="mx-4 w-full max-w-lg p-6">
      <div className="pr-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Verification Details</h3>
      </div>

      {/* Profile Summary */}
      <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
        <p className="mb-3 text-theme-xs font-medium uppercase tracking-wide text-gray-400">Profile Summary</p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={selfieUrl ?? undefined} name={verification.user?.name} size="large" />
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-800 dark:text-white/90">
                {verification.user?.name ?? "Unknown user"}
              </p>
              <p className="truncate text-theme-xs text-gray-400">{verification.user?.email ?? "—"}</p>
            </div>
          </div>
          <StatusBadge tone={verificationStatusTone(verification.status)}>
            {humanize(verification.status)}
          </StatusBadge>
        </div>
      </div>

      {/* KYC Documents */}
      <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        <p className="mb-3 text-theme-xs font-medium uppercase tracking-wide text-gray-400">KYC Documents</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400">
              <DocsIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-theme-sm text-gray-700 dark:text-gray-300">1. ID Proof</p>
              <p className="text-theme-xs text-gray-400">
                {formatIdType(verification.id_type)} · {verification.country}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-theme-sm text-gray-500 dark:text-gray-400">
                {revealedIdNumber
                  ? revealedIdNumber
                  : verification.id_number_last4
                    ? `•••• ${verification.id_number_last4}`
                    : "—"}
              </span>
              {!revealedIdNumber && verification.id_number_last4 && (
                <Can permission="verifications.manage">
                  <button
                    type="button"
                    onClick={() => void revealNumber()}
                    disabled={revealIdNumber.isPending}
                    className="text-theme-xs font-medium text-brand-500 hover:text-brand-600 disabled:opacity-50"
                  >
                    {revealIdNumber.isPending ? "Revealing…" : "Reveal"}
                  </button>
                </Can>
              )}
            </div>
          </div>

          {verification.has_selfie && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-white/[0.05]">
                {selfieUrl ? (
                  <img src={selfieUrl} alt="Submitted selfie" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-theme-xs text-gray-400">
                    {selfieStatus === "error" ? "!" : "…"}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-theme-sm text-gray-700 dark:text-gray-300">2. Selfie Verification</p>
                <p className="text-theme-xs text-gray-400">
                  {selfieStatus === "error" ? "Could not load the selfie" : "Submitted with this attempt"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Automated-provider diagnostics (korapay/smile_id) — only rendered
          when there's actually something to show, so the default 'manual'
          driver's review flow stays clean (job_id/raw_response are always
          null on manual rows). */}
      {(verification.job_id || verification.raw_response) && (
        <details className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
          <summary className="cursor-pointer text-theme-xs font-medium uppercase tracking-wide text-gray-400">
            Provider diagnostics
          </summary>
          <div className="mt-2 space-y-2 text-theme-xs text-gray-500 dark:text-gray-400">
            {verification.job_id && <p>Job ID: {verification.job_id}</p>}
            {verification.provider_status && <p>Provider result: {verification.provider_status}</p>}
            {verification.raw_response && (
              <pre className="max-h-40 overflow-auto rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
                {JSON.stringify(verification.raw_response, null, 2)}
              </pre>
            )}
          </div>
        </details>
      )}

      {canDecide ? (
        <Can
          permission="verifications.manage"
          fallback={
            <p className="mt-4 border-t border-gray-100 pt-4 text-theme-xs text-gray-400 dark:border-gray-800">
              You can view this submission but do not have permission to decide it.
            </p>
          }
        >
          {/* KYC Approval */}
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
            <p className="mb-3 text-theme-xs font-medium uppercase tracking-wide text-gray-400">KYC Approval</p>
            <div className="flex items-center gap-6">
              <Radio
                id="verification-decision-accept"
                name="verification-decision"
                value="approved"
                label="Accept"
                checked={decision === "approved"}
                onChange={() => setDecision("approved")}
              />
              <Radio
                id="verification-decision-reject"
                name="verification-decision"
                value="rejected"
                label="Reject"
                checked={decision === "rejected"}
                onChange={() => setDecision("rejected")}
              />
            </div>
          </div>

          {/* Comments */}
          <div className="mt-4">
            <Label>
              Comments <span className="text-error-500">*</span>
            </Label>
            <TextArea
              value={note}
              onChange={(v) => setNote(v.slice(0, NOTE_MAX))}
              rows={3}
              placeholder="Write a note explaining this decision…"
            />
            <p className="mt-1 text-right text-theme-xs text-gray-400">
              {note.length}/{NOTE_MAX}
            </p>
          </div>
        </Can>
      ) : null}

      {/* Activity Log */}
      <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        <p className="mb-3 text-theme-xs font-medium uppercase tracking-wide text-gray-400">Activity Log</p>
        <ol className="ml-1.5 border-l border-gray-200 dark:border-gray-700">
          <li className="relative pb-4 pl-5 last:pb-0">
            <span className="absolute -left-[6.5px] top-0.5 flex h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white dark:ring-gray-900" />
            <div className="flex items-start justify-between gap-3">
              <p className="text-theme-sm text-gray-700 dark:text-gray-300">
                Submitted <span className="font-normal text-gray-400">(By: {verification.user?.name ?? "User"})</span>
              </p>
              <span className="shrink-0 text-theme-xs text-gray-400">{formatDateTime(verification.submitted_at)}</span>
            </div>
            <p className="text-theme-xs text-gray-400">
              {formatIdType(verification.id_type)} submitted for in-house review
            </p>
          </li>
          {verification.completed_at && (
            <li className="relative pl-5">
              <span
                className={`absolute -left-[6.5px] top-0.5 flex h-3 w-3 rounded-full ring-4 ring-white dark:ring-gray-900 ${
                  verification.status === "approved" ? "bg-success-500" : "bg-error-500"
                }`}
              />
              <div className="flex items-start justify-between gap-3">
                <p className="text-theme-sm text-gray-700 dark:text-gray-300">
                  {humanize(verification.status)}{" "}
                  <span className="font-normal text-gray-400">(By: {verification.decided_by?.name ?? "Staff"})</span>
                </p>
                <span className="shrink-0 text-theme-xs text-gray-400">{formatDateTime(verification.completed_at)}</span>
              </div>
              {verification.reason && <p className="text-theme-xs text-gray-400">{verification.reason}</p>}
            </li>
          )}
        </ol>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={onClose} disabled={decide.isPending}>
          Cancel
        </Button>
        {canDecide && (
          <Can permission="verifications.manage">
            <Button size="sm" variant="primary" onClick={() => void submit()} disabled={!canSubmit}>
              {decide.isPending ? "Saving…" : "Update"}
            </Button>
          </Can>
        )}
      </div>
    </Modal>
  );
}
