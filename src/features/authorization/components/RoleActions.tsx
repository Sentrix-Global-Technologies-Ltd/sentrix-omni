import { useState } from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import Checkbox from "../../../components/form/input/Checkbox";
import { useDeleteRole, usePermissionPicker, useUpdateRole } from "../hooks/useAuthorization";
import type { Role } from "../api/authz.api";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Per-role actions (edit / delete), each permission-gated on roles.manage. */
export default function RoleActions({ role }: { role: Role }) {
  const update = useUpdateRole(role.id);
  const del = useDeleteRole(role.id);
  const permsQuery = usePermissionPicker();

  const [name, setName] = useState(role.name);
  const [selected, setSelected] = useState<Set<string>>(
    new Set((role.permissions ?? []).map((p) => p.name)),
  );

  const permissions = permsQuery.data?.data ?? [];

  const resetForm = () => {
    setName(role.name);
    setSelected(new Set((role.permissions ?? []).map((p) => p.name)));
  };

  const togglePermission = (permName: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(permName);
      else next.delete(permName);
      return next;
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Can permission="roles.manage">
        <ConfirmActionButton
          label="Edit"
          title="Edit role"
          description={`Rename ${role.name} and change its permission set.`}
          confirmLabel="Save changes"
          successMessage="Role updated"
          onOpen={resetForm}
          onConfirm={() =>
            update.mutateAsync({
              name: name.trim() !== role.name ? name.trim() : undefined,
              permissions: Array.from(selected),
            })
          }
        >
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Permissions</label>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                {permsQuery.isLoading ? (
                  <p className="text-theme-xs text-gray-400">Loading…</p>
                ) : permissions.length === 0 ? (
                  <p className="text-theme-xs text-gray-400">No permissions available.</p>
                ) : (
                  permissions.map((p) => (
                    <Checkbox
                      key={p.id}
                      id={`role-${role.id}-perm-${p.id}`}
                      label={p.name}
                      checked={selected.has(p.name)}
                      onChange={(checked) => togglePermission(p.name, checked)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </ConfirmActionButton>
        <ConfirmActionButton
          label="Delete"
          tone="danger"
          title="Delete role?"
          description={`Delete ${role.name}. Members holding this role lose the permissions it grants. Default roles cannot be deleted.`}
          confirmLabel="Delete"
          successMessage="Role deleted"
          onConfirm={() => del.mutateAsync()}
        />
      </Can>
    </div>
  );
}
