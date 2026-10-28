import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import BridgeRowMenu from "./BridgeRowMenu";
import { bridgeHealthTone, relativeTime, titleCase } from "./siteBridgeTone";
import type { CameraBridge } from "../api/site-bridges.types";

interface Props {
  bridges: CameraBridge[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Site Bridge fleet — machine credentials that authenticate this org's own CCTV/NVR feed ingest. */
export default function BridgeTable({ bridges, isLoading, error, onRetry }: Props) {
  const columns: Column<CameraBridge>[] = [
    {
      key: "label",
      header: "Bridge",
      render: (b) => <p className="font-medium text-gray-800 dark:text-white/90">{b.label}</p>,
    },
    {
      key: "status",
      header: "Status",
      render: (b) => <StatusBadge tone={bridgeHealthTone(b.status)}>{titleCase(b.status)}</StatusBadge>,
    },
    {
      key: "health",
      header: "Health",
      render: (b) => <StatusBadge tone={bridgeHealthTone(b.health)}>{titleCase(b.health)}</StatusBadge>,
    },
    {
      key: "last_seen",
      header: "Last seen",
      render: (b) => (
        <span className="text-gray-500 dark:text-gray-400">{relativeTime(b.last_seen_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right w-16",
      render: (b) => <BridgeRowMenu bridge={b} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={bridges}
      rowKey={(b) => b.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No Site Bridges"
      emptyDescription="No desktop bridges are onboarded for this organization yet."
    />
  );
}
