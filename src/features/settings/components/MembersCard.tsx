import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import Badge from "../../../components/ui/badge/Badge";
import MemberActions from "./MemberActions";
import { formatDateTime } from "../../../lib/format";
import { useMembers } from "../hooks/useMembers";
import type { Member } from "../api/settings.types";

/**
 * Organization members. Rendered only inside <Can permission="members.view">,
 * so the query (and the 403-prone endpoint) only runs for permitted users.
 */
export default function MembersCard() {
  const query = useMembers();
  const members = query.data?.data ?? [];

  const columns: Column<Member>[] = [
    {
      key: "member",
      header: "Member",
      render: (m) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{m.name}</p>
          <p className="mt-0.5 text-theme-xs text-gray-400">{m.email}</p>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      render: (m) => (
        <div className="flex flex-wrap gap-1">
          {m.roles.length > 0 ? (
            m.roles.map((r) => (
              <Badge key={r} variant="light" color="primary">
                {r}
              </Badge>
            ))
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (m) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(m.joined_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (m) => <MemberActions member={m} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={members}
      rowKey={(m) => m.id}
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => void query.refetch()}
      emptyTitle="No members"
    />
  );
}
