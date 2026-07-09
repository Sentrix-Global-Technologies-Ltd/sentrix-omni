import { useState } from "react";
import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import type { Tone } from "../../../components/ui/tone";
import { formatDateTime } from "../../../lib/format";
import { useInvitations } from "../hooks/useInvitations";
import { useInvitationActions } from "../hooks/useSettingsActions";
import { ORG_ROLES, type Invitation } from "../api/settings.types";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function statusTone(status: Invitation["status"]): Tone {
  if (status === "accepted") return "success";
  if (status === "expired") return "light";
  return "warning";
}

/** Invitations: send + list + revoke (permission-gated). */
export default function InvitationsCard() {
  const query = useInvitations();
  const actions = useInvitationActions();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("User");

  const invitations = query.data?.data ?? [];

  const columns: Column<Invitation>[] = [
    {
      key: "email",
      header: "Email",
      render: (i) => <span className="font-medium text-gray-800 dark:text-white/90">{i.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (i) => <span className="text-gray-600 dark:text-gray-300">{i.role}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (i) => <StatusBadge tone={statusTone(i.status)}>{i.status}</StatusBadge>,
    },
    {
      key: "expires",
      header: "Expires",
      render: (i) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(i.expires_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (i) =>
        i.status === "pending" ? (
          <Can permission="members.invite">
            <ConfirmActionButton
              label="Revoke"
              tone="danger"
              title="Revoke invitation?"
              description={`Revoke the invitation for ${i.email}.`}
              confirmLabel="Revoke"
              successMessage="Invitation revoked"
              onConfirm={() => actions.revoke.mutateAsync(i.id)}
            />
          </Can>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Invitations</h3>
        <Can permission="members.invite">
          <ConfirmActionButton
            label="Invite member"
            triggerVariant="primary"
            title="Invite a member"
            description="Send an invitation to join this organization. They'll receive an email to accept."
            confirmLabel="Send invite"
            successMessage="Invitation sent"
            onOpen={() => {
              setEmail("");
              setRole("User");
            }}
            onConfirm={() => actions.invite.mutateAsync({ email, role })}
          >
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="person@example.com"
                className={fieldClass}
              />
              <select value={role} onChange={(e) => setRole(e.target.value)} className={fieldClass}>
                {ORG_ROLES.map((r) => (
                  <option key={r} value={r} className="dark:bg-gray-900">
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </ConfirmActionButton>
        </Can>
      </div>

      <DataTable
        columns={columns}
        rows={invitations}
        rowKey={(i) => i.id}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyTitle="No invitations"
        emptyDescription="No pending invitations for this organization."
      />
    </div>
  );
}
