import { useState, useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import Can from "../../../components/shared/Can";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";
import AddResponderAction from "./AddResponderAction";
import ResponderLineActions from "./ResponderLineActions";
import { useAssignment } from "../hooks/useAssignment";
import { useAssignmentActions } from "../hooks/useAssignmentActions";
import { useToast } from "../../../components/shared/toast";
import {
  assignmentStatusTone,
  formatDateTime,
  humanize,
  lineTone,
} from "./assignmentTone";

type ActionKey = "complete" | "cancel";

const CONFIGS: Record<
  ActionKey,
  { title: string; description: string; confirmLabel: string; tone: "primary" | "danger" }
> = {
  complete: {
    title: "Complete assignment?",
    description: "Mark this assignment as completed.",
    confirmLabel: "Complete",
    tone: "primary",
  },
  cancel: {
    title: "Cancel assignment?",
    description: "Cancelling stands down this dispatch and its responders.",
    confirmLabel: "Cancel assignment",
    tone: "danger",
  },
};

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ActionIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

interface Props {
  assignmentId: string;
  onClose: () => void;
}

export default function AssignmentDrawer({ assignmentId, onClose }: Props): ReactNode {
  const query = useAssignment(assignmentId);
  const actions = useAssignmentActions(assignmentId);
  const toast = useToast();

  const assignment = query.data?.data;

  const [takeActionOpen, setTakeActionOpen] = useState(false);
  const takeActionRef = useRef<HTMLDivElement>(null);
  const [pendingAction, setPendingAction] = useState<ActionKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Close on Escape when no confirm dialog is open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pendingAction) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, pendingAction]);

  // Close Take Action dropdown on outside click
  useEffect(() => {
    if (!takeActionOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        takeActionRef.current &&
        !takeActionRef.current.contains(e.target as Node)
      ) {
        setTakeActionOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [takeActionOpen]);

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setSubmitting(true);
    try {
      if (pendingAction === "complete") await actions.complete.mutateAsync();
      else if (pendingAction === "cancel") await actions.cancel.mutateAsync();
      toast.success("Action completed successfully.");
      setPendingAction(null);
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isTerminal = assignment
    ? ["completed", "cancelled"].includes(assignment.status)
    : false;

  const cfg = pendingAction ? CONFIGS[pendingAction] : null;

  return (
    <>
      {/* Overlay */}
      <div className="ic-drawer-overlay" onClick={onClose} aria-hidden="true" />

      {/* Drawer panel */}
      <aside
        className="ic-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={
          assignment
            ? `Assignment ${assignment.id.slice(0, 8)}`
            : "Assignment details"
        }
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="ic-drawer-header">
          <div className="ic-drawer-hdr-title-row">
            <h2 className="ic-drawer-title">
              {assignment
                ? `Assignment ${assignment.id.slice(0, 8)}`
                : "Loading…"}
            </h2>
            <div className="ic-drawer-hdr-actions">
              {assignment && (
                <StatusBadge tone={assignmentStatusTone[assignment.status]}>
                  {humanize(assignment.status)}
                </StatusBadge>
              )}
              <button
                type="button"
                className="ic-drawer-close"
                onClick={onClose}
                aria-label="Close assignment details"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
          {assignment && (
            <div className="ic-drawer-inc-id">
              ASN-{assignment.id.slice(0, 8).toUpperCase()}
            </div>
          )}
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="ic-drawer-body">
          {query.isError && (
            <div className="ic-drawer-section">
              <p style={{ color: "#ef4444", fontSize: "0.8125rem" }}>
                Failed to load assignment details.
              </p>
            </div>
          )}

          {assignment && (
            <>
              {/* Dispatch metadata */}
              <div className="ic-drawer-section ic-drawer-section--meta" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <div className="ic-detail-row">
                  <div className="ic-detail-label-group">
                    <span className="ic-detail-icon">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    </span>
                    <span className="ic-detail-label">Mode</span>
                  </div>
                  <div className="ic-detail-val">
                    {assignment.dispatch_mode ?? "—"}
                  </div>
                </div>

                <div className="ic-detail-row">
                  <div className="ic-detail-label-group">
                    <span className="ic-detail-icon">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
                        <path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                    </span>
                    <span className="ic-detail-label">Required</span>
                  </div>
                  <div className="ic-detail-val">
                    {assignment.required_primary}P ·{" "}
                    {assignment.required_supporting}S
                  </div>
                </div>

                <div className="ic-detail-row">
                  <div className="ic-detail-label-group">
                    <span className="ic-detail-icon">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    </span>
                    <span className="ic-detail-label">Escalation</span>
                  </div>
                  <div className="ic-detail-val">
                    Level {assignment.escalation_level}
                  </div>
                </div>

                {assignment.acceptance_deadline_at && (
                  <div className="ic-detail-row">
                    <div className="ic-detail-label-group">
                      <span className="ic-detail-icon">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </span>
                      <span className="ic-detail-label">Deadline</span>
                    </div>
                    <div className="ic-detail-val">
                      {formatDateTime(assignment.acceptance_deadline_at)}
                    </div>
                  </div>
                )}

                {assignment.incident_id && (
                  <div className="ic-detail-row">
                    <div className="ic-detail-label-group">
                      <span className="ic-detail-icon">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </span>
                      <span className="ic-detail-label">Incident</span>
                    </div>
                    <div className="ic-detail-val">
                      <Link
                        to={`/incidents/${assignment.incident_id}`}
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                        onClick={onClose}
                      >
                        {assignment.incident_id.slice(0, 8)}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Responder lines */}
              <div className="ic-drawer-section">
                <div className="ic-drawer-section-title">Responder Lines</div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <AddResponderAction assignmentId={assignmentId} />
                </div>

                {(assignment.responders ?? []).length === 0 ? (
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.8125rem",
                      margin: 0,
                    }}
                  >
                    No responders assigned yet.
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {(assignment.responders ?? []).map((line, idx, arr) => (
                      <li
                        key={line.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          borderBottom:
                            idx < arr.length - 1
                              ? "1px solid #f3f4f6"
                              : "none",
                          paddingBottom:
                            idx < arr.length - 1 ? "1.125rem" : "0",
                          marginBottom:
                            idx < arr.length - 1 ? "1.125rem" : "0",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              marginBottom: "0.25rem",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: "var(--color-gray-800, #1f2937)",
                              }}
                            >
                              {humanize(line.role)}
                            </span>
                            <StatusBadge tone={lineTone(line.status)}>
                              {humanize(line.status)}
                            </StatusBadge>
                          </div>
                          <Link
                            to={`/responders/${line.responder_id}`}
                            className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                            style={{
                              display: "block",
                              fontSize: "0.8125rem",
                              marginBottom: "0.125rem",
                            }}
                            onClick={onClose}
                          >
                            {line.responder_name ??
                              `Responder ${line.responder_id.slice(0, 8)}`}
                          </Link>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#9ca3af",
                              margin: 0,
                            }}
                          >
                            Offered {formatDateTime(line.offered_at)}
                            {line.on_scene_at
                              ? ` · On scene ${formatDateTime(line.on_scene_at)}`
                              : ""}
                          </p>
                        </div>
                        <ResponderLineActions
                          assignmentId={assignmentId}
                          line={line}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {query.isLoading && !assignment && (
            <div className="ic-drawer-section">
              <p style={{ color: "#9ca3af", fontSize: "0.8125rem" }}>
                Loading assignment…
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        {assignment && !isTerminal && (
          <div className="ic-drawer-footer">
            {!isTerminal && (
              <Can permission="assignments.dispatch">
                <div className="ic-take-action-wrap" ref={takeActionRef}>
                  {takeActionOpen && (
                    <div className="ic-take-action-menu" role="menu">
                      <button
                        type="button"
                        className="ic-take-action-item"
                        onClick={() => {
                          setTakeActionOpen(false);
                          setPendingAction("complete");
                        }}
                      >
                        Mark complete
                      </button>
                      <Can permission="assignments.cancel">
                        <button
                          type="button"
                          className="ic-take-action-item ic-take-action-item--danger"
                          onClick={() => {
                            setTakeActionOpen(false);
                            setPendingAction("cancel");
                          }}
                        >
                          Cancel assignment
                        </button>
                      </Can>
                    </div>
                  )}
                  <button
                    type="button"
                    className="ic-footer-btn ic-footer-btn--action"
                    onClick={() => setTakeActionOpen((p) => !p)}
                    aria-haspopup="menu"
                    aria-expanded={takeActionOpen}
                  >
                    <ActionIcon />
                    Take Action
                    <ChevronIcon />
                  </button>
                </div>
              </Can>
            )}
          </div>
        )}
      </aside>

      {/* Confirm dialog for pending action */}
      {cfg && (
        <ConfirmDialog
          open={!!pendingAction}
          onClose={() => (submitting ? undefined : setPendingAction(null))}
          title={cfg.title}
          description={cfg.description}
          confirmLabel={cfg.confirmLabel}
          tone={cfg.tone}
          loading={submitting}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
