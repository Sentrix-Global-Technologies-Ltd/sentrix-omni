import { useState, useMemo } from "react";
import ListToolbar from "../../../components/shared/ListToolbar";
import CursorPagination, { type CursorMeta } from "../../../components/ui/pagination/CursorPagination";
import AuditTable from "../../audit/components/AuditTable";
import { useAuditLogs } from "../../audit/hooks/useAuditLogs";
import type { AuditFilters as Filters, AuditLog } from "../../audit/api/audit.types";

const DEFAULT_PAGE_SIZE = 25;

/**
 * The Evidence Vault's "Audit Log" tab — organisation-wide audit trail scoped
 * to evidence activity, surfaced inline inside the tabbed Evidence Vault page.
 *
 * Uses the shared ListToolbar for client-side search (action / actor / subject /
 * IP), refresh, and page-size control. Cursor pagination keeps server requests
 * O(1) on a large append-only table.
 */
export default function EvidenceAuditTab() {
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  const filters: Filters = {
    cursor,
    per_page: perPage,
  };

  const query = useAuditLogs(filters);
  const logs = query.data?.data ?? [];
  const meta = query.data?.meta as CursorMeta | undefined;

  // Client-side search over the currently loaded page.
  // Matches against action, actor name, subject type/id, and IP address.
  const visible = useMemo<AuditLog[]>(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        (l.actor_name ?? "").toLowerCase().includes(q) ||
        (l.subject?.type ?? "").toLowerCase().includes(q) ||
        (l.subject?.id ?? "").toLowerCase().includes(q) ||
        (l.ip_address ?? "").includes(q),
    );
  }, [logs, search]);

  /** Switch page size and restart from the first cursor page. */
  const handlePageSizeChange = (size: number) => {
    setPerPage(size);
    setCursor(undefined);
    setSearch("");
  };

  /** Move to a cursor page and clear any active search. */
  const handleCursor = (c: string | null) => {
    setCursor(c ?? undefined);
    setSearch("");
  };

  return (
    <>
      <ListToolbar
        search={search}
        onSearch={setSearch}
        visibleCount={visible.length}
        totalCount={null}
        isLoading={query.isLoading}
        pageSize={perPage}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={() => void query.refetch()}
        placeholder="Search action, actor, subject, or IP…"
        refreshLabel="Refresh audit log"
      />
      <AuditTable
        logs={visible}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
      />
      <CursorPagination meta={meta} onCursor={handleCursor} />
    </>
  );
}
