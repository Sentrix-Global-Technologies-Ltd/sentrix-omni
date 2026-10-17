import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import ListToolbar from "../../../components/shared/ListToolbar";
import ListPagination from "../../../components/shared/ListPagination";
import EmergencyFilters from "../components/EmergencyFilters";
import EmergencyTable from "../components/EmergencyTable";
import { useEmergencies } from "../hooks/useEmergencies";
import { useEmergenciesRealtime } from "../hooks/useEmergenciesRealtime";
import type { Emergency, EmergencyFilters as Filters } from "../api/emergencies.types";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

const DEFAULT_PAGE_SIZE = 25;

export default function EmergencyListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filters: Filters = {
    status:   params.get("status")   ?? undefined,
    severity: params.get("severity") ?? undefined,
    page:     params.get("page")     ? Number(params.get("page")) : undefined,
    per_page: params.get("per_page") ? Number(params.get("per_page")) : DEFAULT_PAGE_SIZE,
  };

  const { connected } = useEmergenciesRealtime();
  const query = useEmergencies(filters);

  const emergencies = query.data?.data ?? [];
  const meta = query.data?.meta as PaginatorMeta | undefined;

  // ── Client-side search over current page ──────────────────────────────────
  const [search, setSearch] = useState("");
  const visible = useMemo<Emergency[]>(() => {
    if (!search.trim()) return emergencies;
    const q = search.toLowerCase();
    return emergencies.filter(
      (e) =>
        e.message?.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.status?.toLowerCase().includes(q),
    );
  }, [emergencies, search]);

  // ── Filter / page helpers ─────────────────────────────────────────────────
  const updateFilters = useCallback((next: Partial<Filters>) => {
    setSearch("");
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.status)   sp.set("status",   merged.status);
    if (merged.severity) sp.set("severity", merged.severity);
    if (merged.per_page && merged.per_page !== DEFAULT_PAGE_SIZE)
      sp.set("per_page", String(merged.per_page));
    if (next.page !== undefined) sp.set("page", String(next.page));
    setParams(sp);
  }, [filters, setParams]);

  const clear = useCallback(() => { setSearch(""); setParams(new URLSearchParams()); }, [setParams]);

  const setPage = useCallback((page: number) => updateFilters({ page }), [updateFilters]);

  const setPageSize = useCallback(
    (size: number) => updateFilters({ per_page: size, page: undefined }),
    [updateFilters],
  );

  return (
    <>
      <PageMeta title="Emergencies | Sentrix Console" description="Emergency coordination" />
      <PageHeader
        title="Emergencies"
        breadcrumbs={[{ label: "Emergencies" }]}
      />

      <div className="flex flex-col gap-4 pb-6">
        <EmergencyFilters filters={filters} onChange={updateFilters} onClear={clear} />

        <ListToolbar
          search={search}
          onSearch={setSearch}
          visibleCount={visible.length}
          totalCount={meta?.total ?? null}
          isLoading={query.isLoading}
          pageSize={filters.per_page ?? DEFAULT_PAGE_SIZE}
          onPageSizeChange={setPageSize}
          onRefresh={() => void query.refetch()}
          connected={connected}
          placeholder="Search emergencies…"
          refreshLabel="Refresh emergencies"
        />

        <EmergencyTable
          emergencies={visible}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
          onRowClick={(e: Emergency) => navigate(`/emergencies/${e.id}`)}
        />

        {meta && !query.isLoading && (
          <ListPagination
            currentPage={meta.current_page ?? 1}
            lastPage={meta.last_page ?? 1}
            total={meta.total}
            from={meta.from}
            to={meta.to}
            onPageChange={setPage}
          />
        )}
      </div>
    </>
  );
}
