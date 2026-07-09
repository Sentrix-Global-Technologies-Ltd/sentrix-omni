import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import Pagination from "../../../components/ui/pagination/Pagination";
import EmptyState from "../../../components/ui/state/EmptyState";
import { usePermissionCatalogue, useRoles } from "../hooks/useAuthorization";
import type { Permission } from "../api/authz.api";
import CreateRoleButton from "../components/CreateRoleButton";
import RoleActions from "../components/RoleActions";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

export default function RolesPage() {
  const [page, setPage] = useState(1);
  const rolesQuery = useRoles();
  const permsQuery = usePermissionCatalogue(page);

  const roles = rolesQuery.data?.data ?? [];
  const permsMeta = permsQuery.data?.meta as PaginatorMeta | undefined;

  const columns: Column<Permission>[] = [
    {
      key: "name",
      header: "Permission",
      render: (p) => <span className="font-mono text-theme-sm text-gray-800 dark:text-white/90">{p.name}</span>,
    },
    {
      key: "guard",
      header: "Guard",
      render: (p) => <span className="text-gray-500 dark:text-gray-400">{p.guard_name}</span>,
    },
  ];

  return (
    <>
      <PageMeta title="Roles & Permissions | Sentrix Console" description="Organization roles and permissions" />
      <PageHeader
        title="Roles & Permissions"
        breadcrumbs={[{ label: "Roles" }]}
        actions={<CreateRoleButton />}
      />

      <div className={`${card} mb-6`}>
        <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Organization roles</h3>
        {roles.length === 0 ? (
          <EmptyState title="No roles" description={rolesQuery.isLoading ? "Loading…" : "No roles defined."} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-gray-200 px-4 py-2 dark:border-gray-800"
              >
                <p className="font-medium text-gray-800 dark:text-white/90">{r.name}</p>
                {r.permissions && r.permissions.length > 0 && (
                  <p className="mt-0.5 text-theme-xs text-gray-400">{r.permissions.length} permissions</p>
                )}
                <div className="mt-2">
                  <RoleActions role={r} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Permission catalogue</h3>
        <StatusBadge tone="light">read-only</StatusBadge>
      </div>
      <DataTable
        columns={columns}
        rows={permsQuery.data?.data ?? []}
        rowKey={(p) => p.id}
        isLoading={permsQuery.isLoading}
        error={permsQuery.error}
        onRetry={() => void permsQuery.refetch()}
        emptyTitle="No permissions"
      />
      {permsMeta && (
        <Pagination
          currentPage={permsMeta.current_page ?? 1}
          lastPage={permsMeta.last_page ?? 1}
          total={permsMeta.total}
          from={permsMeta.from}
          to={permsMeta.to}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
