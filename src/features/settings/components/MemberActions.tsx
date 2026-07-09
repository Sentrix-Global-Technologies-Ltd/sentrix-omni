import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useMemberActions } from "../hooks/useSettingsActions";
import { ORG_ROLES, type Member } from "../api/settings.types";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Per-row member actions (role change / remove), each permission-gated. */
export default function MemberActions({ member }: { member: Member }) {
  const a = useMemberActions(member.id);
  const [role, setRole] = useState(member.roles[0] ?? "User");

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Can permission="members.update">
        <ConfirmActionButton
          label="Change role"
          title="Change member role"
          description={`Set the organization role for ${member.name}.`}
          confirmLabel="Update role"
          successMessage="Member role updated"
          onOpen={() => setRole(member.roles[0] ?? "User")}
          onConfirm={() => a.changeRole.mutateAsync(role)}
        >
          <select value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
            {ORG_ROLES.map((r) => (
              <option key={r} value={r} className="dark:bg-gray-900">
                {r}
              </option>
            ))}
          </select>
        </ConfirmActionButton>
      </Can>
      <Can permission="members.remove">
        <ConfirmActionButton
          label="Remove"
          tone="danger"
          title="Remove member?"
          description={`Remove ${member.name} from this organization. They lose all access.`}
          confirmLabel="Remove"
          successMessage="Member removed"
          onConfirm={() => a.remove.mutateAsync()}
        />
      </Can>
    </div>
  );
}
