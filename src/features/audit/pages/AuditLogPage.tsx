import { useSearchParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import CursorPagination, { type CursorMeta } from "../../../components/ui/pagination/CursorPagination";
import AuditFilters from "../components/AuditFilters";
import AuditTable from "../components/AuditTable";
import { useAuditLogs } from "../hooks/useAuditLogs";
import type { AuditFilters as Filters } from "../api/audit.types";

export default function AuditLogPage() {
  const [params, setParams] = useSearchParams();

  const filters: Filters = {
    action: params.get("action") ?? undefined,
    cursor: params.get("cursor") ?? undefined,
  };

  const query = useAuditLogs(filters);

  // Changing the filter resets pagination (cursor omitted from new params).
  const updateFilters = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.action) sp.set("action", merged.action);
    setParams(sp);
  };

  const clear = () => setParams(new URLSearchParams());

  const setCursor = (cursor: string | null) => {
    const sp = new URLSearchParams();
    if (filters.action) sp.set("action", filters.action);
    if (cursor) sp.set("cursor", cursor);
    setParams(sp);
  };

  const logs = query.data?.data ?? [];
  const meta = query.data?.meta as CursorMeta | undefined;

  return (
    <>
      <PageMeta title="Audit | Sentrix Console" description="Organization audit log" />
      <PageHeader title="Audit Log" breadcrumbs={[{ label: "Audit" }]} />

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
