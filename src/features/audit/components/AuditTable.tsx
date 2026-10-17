import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import type { Tone } from "../../../components/ui/tone";
import { formatDateTime, relativeTime, humanize } from "../../../lib/format";
import type { AuditLog } from "../api/audit.types";

/** Map an audit action's prefix/suffix to a semantic tone. */
function actionTone(action: string): Tone {
  if (action.includes("hold") || action.includes("seal") || action.includes("lock")) return "warning";
  if (action.includes("delete") || action.includes("destroy") || action.includes("revoke")) return "error";
  if (action.includes("create") || action.includes("add") || action.includes("bookmark")) return "success";
  if (action.includes("export") || action.includes("download") || action.includes("transfer")) return "info";
  if (action.includes("login") || action.includes("access") || action.includes("view")) return "primary";
  return "light";
}

/** One-letter colour-keyed initials circle for actor column. */
function ActorAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
      {initials}
    </span>
  );
}

function SystemAvatar() {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500 dark:bg-white/[0.05] dark:text-gray-400">
      SY
    </span>
  );
}

interface Props {
  logs: AuditLog[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

export default function AuditTable({ logs, isLoading, error, onRetry }: Props) {
  const columns: Column<AuditLog>[] = [
    {
      key: "action",
      header: "Action",
      render: (l) => (
        <StatusBadge tone={actionTone(l.action)}>
          {humanize(l.action)}
        </StatusBadge>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (l) => {
        const name = l.actor_name ?? null;
        const short = l.actor_id ? l.actor_id.slice(0, 8) : null;
        const display = name ?? (short ? `${short}…` : null);
        return display ? (
          <div className="flex items-center gap-2">
            <ActorAvatar name={display} />
            <span className="text-sm text-gray-700 dark:text-gray-300">{display}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <SystemAvatar />
            <span className="text-sm text-gray-400 dark:text-gray-500">System</span>
          </div>
        );
      },
    },
    {
      key: "subject",
      header: "Subject",
      headerClassName: "hidden sm:table-cell",
      className: "hidden sm:table-cell",
      render: (l) =>
        l.subject ? (
          <div className="flex items-center gap-2">
            <StatusBadge tone="light">{l.subject.type}</StatusBadge>
            <span className="font-mono text-xs text-gray-400">
              #{l.subject.id.slice(0, 8)}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "ip",
      header: "IP",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      render: (l) => (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          {l.ip_address ?? "—"}
        </span>
      ),
    },
    {
      key: "time",
      header: "When",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      render: (l) => (
        <div title={formatDateTime(l.created_at)}>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {relativeTime(l.created_at)}
          </p>
          <p className="mt-0.5 text-theme-xs text-gray-400">
            {formatDateTime(l.created_at)}
          </p>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={logs}
      rowKey={(l) => l.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No audit entries"
      emptyDescription="No audit activity matches the current filter."
    />
  );
}
