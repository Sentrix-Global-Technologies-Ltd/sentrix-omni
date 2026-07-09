import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Checkbox from "../../../components/form/input/Checkbox";
import Can from "../../../components/shared/Can";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useCreateRole, usePermissionPicker } from "../hooks/useAuthorization";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Create an organization role: name + permission picker (roles.manage). */
export default function CreateRoleButton() {
  const create = useCreateRole();
  const permsQuery = usePermissionPicker();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const permissions = permsQuery.data?.data ?? [];

  const reset = () => {
    setName("");
    setSelected(new Set());
  };

  const togglePermission = (permName: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(permName);
      else next.delete(permName);
      return next;
    });
  };

  const submit = async () => {
    try {
      await create.mutateAsync({
        name: name.trim(),
        permissions: selected.size > 0 ? Array.from(selected) : undefined,
      });
      setOpen(false);
      toast.success("Role created");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create the role.");
    }
  };

  return (
    <Can permission="roles.manage">
      <Button
        size="sm"
        variant="primary"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        New role
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Create a role</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shift Supervisor"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Permissions</label>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              {permsQuery.isLoading ? (
                <p className="text-theme-xs text-gray-400">Loading…</p>
              ) : permissions.length === 0 ? (
                <p className="text-theme-xs text-gray-400">No permissions available.</p>
              ) : (
                permissions.map((p) => (
                  <Checkbox
                    key={p.id}
                    id={`create-role-perm-${p.id}`}
                    label={p.name}
                    checked={selected.has(p.name)}
                    onChange={(checked) => togglePermission(p.name, checked)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={submit} disabled={create.isPending || !name.trim()}>
            {create.isPending ? "Working…" : "Create role"}
          </Button>
        </div>
      </Modal>
    </Can>
  );
}
