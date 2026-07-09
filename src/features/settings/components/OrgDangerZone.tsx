import { useState } from "react";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useAuth } from "../../../context/AuthContext";
import { useMembers } from "../hooks/useMembers";
import { useOrganizationActions } from "../hooks/useSettingsActions";
import type { OrganizationDetails } from "../api/settings.types";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/**
 * Owner-only destructive actions: transfer ownership and delete organization.
 * Only the current owner sees this (the backend independently enforces both).
 */
export default function OrgDangerZone({ org }: { org: OrganizationDetails }) {
  const { principal } = useAuth();
  const actions = useOrganizationActions();
  const membersQuery = useMembers();
  const [newOwner, setNewOwner] = useState("");

  const isOwner = Boolean(principal && org.owner_id === principal.id);
  if (!isOwner) return null;

  const candidates = (membersQuery.data?.data ?? []).filter((m) => m.id !== org.owner_id);

  return (
    <div className="rounded-2xl border border-error-200 bg-error-50/40 p-5 dark:border-error-500/30 dark:bg-error-500/[0.06] md:p-6">
      <h3 className="text-sm font-semibold text-error-600 dark:text-error-400">Danger zone</h3>
      <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
        Owner-only actions. These are irreversible — proceed with care.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <ConfirmActionButton
          label="Transfer ownership"
          title="Transfer organization ownership"
          description="Hand ownership to another member. You will remain a member but lose owner privileges."
          confirmLabel="Transfer ownership"
          tone="danger"
          successMessage="Ownership transferred"
          disabled={candidates.length === 0}
          onOpen={() => setNewOwner(candidates[0]?.id ?? "")}
          onConfirm={() => actions.transferOwnership.mutateAsync(newOwner)}
        >
          {candidates.length > 0 ? (
            <select
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              className={selectClass}
            >
              {candidates.map((m) => (
                <option key={m.id} value={m.id} className="dark:bg-gray-900">
                  {m.name} · {m.email}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-theme-sm text-gray-500">
              There are no other members to transfer to. Invite someone first.
            </p>
          )}
        </ConfirmActionButton>

        <ConfirmActionButton
          label="Delete organization"
          title="Delete this organization?"
          description={`Permanently delete "${org.name}" and all its data. This cannot be undone.`}
          confirmLabel="Delete organization"
          tone="danger"
          successMessage="Organization deleted"
          onConfirm={async () => {
            await actions.deleteOrg.mutateAsync();
            // The active tenant is gone — re-bootstrap from a clean state.
            window.location.assign("/");
          }}
        />
      </div>
    </div>
  );
}
