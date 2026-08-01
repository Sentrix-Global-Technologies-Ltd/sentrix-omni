import { useState } from "react";
import CursorPagination, { type CursorMeta } from "../../../components/ui/pagination/CursorPagination";
import AuditFilters from "../../audit/components/AuditFilters";
import AuditTable from "../../audit/components/AuditTable";
import { useAuditLogs } from "../../audit/hooks/useAuditLogs";
import type { AuditFilters as Filters } from "../../audit/api/audit.types";

/**
 * The Evidence Vault's "Audit Log" tab — the SAME organization audit trail
 * the standalone /audit console reads (no second logging path), just
 * surfaced inline where the screenshots put it. Local filter/cursor state
 * (not URL params) since this is embedded inside a tabbed page.
 */
export default function EvidenceAuditTab() {
  const [filters, setFilters] = useState<Filters>({});

  const query = useAuditLogs(filters);
  const logs = query.data?.data ?? [];
  const meta = query.data?.meta as CursorMeta | undefined;

  const updateFilters = (next: Partial<Filters>) =>
    setFilters((f) => ({ ...f, ...next, cursor: undefined }));
  const clear = () => setFilters({});
  const setCursor = (cursor: string | null) =>
    setFilters((f) => ({ ...f, cursor: cursor ?? undefined }));

  return (
    <>
      <AuditFilters filters={filters} onChange={updateFilters} onClear={clear} />
      <AuditTable
        logs={logs}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
      />
      <CursorPagination meta={meta} onCursor={setCursor} />
    </>
  );
}
