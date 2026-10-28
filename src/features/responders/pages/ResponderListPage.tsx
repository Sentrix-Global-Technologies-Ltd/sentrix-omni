import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import ListToolbar from "../../../components/shared/ListToolbar";
import ListPagination from "../../../components/shared/ListPagination";
import ResponderFilters from "../components/ResponderFilters";
import ResponderTable from "../components/ResponderTable";
import RegisterResponderButton from "../components/RegisterResponderButton";
import { useResponders } from "../hooks/useResponders";
import { useRespondersRealtime } from "../hooks/useRespondersRealtime";
import type { Responder, ResponderFilters as Filters } from "../api/responders.types";
import "../../incidents/styles/incidents-centre.css";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

const DEFAULT_PAGE_SIZE = 25;

export default function ResponderListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filters: Filters = {
    status:     params.get("status")     ?? undefined,
    assignable: params.get("assignable") ?? undefined,
    page:       params.get("page")       ? Number(params.get("page")) : undefined,
    perPage:    params.get("per_page")   ? Number(params.get("per_page")) : DEFAULT_PAGE_SIZE,
  };

  const { connected } = useRespondersRealtime();
  const query = useResponders(filters);

  const responders = query.data?.data ?? [];
  const meta = query.data?.meta as PaginatorMeta | undefined;

  // ── Client-side search over current page ──────────────────────────────────
  const [search, setSearch] = useState("");
  const visible = useMemo<Responder[]>(() => {
    if (!search.trim()) return responders;
    const q = search.toLowerCase();
    return responders.filter(
      (r) =>
        (r.user_name ?? "").toLowerCase().includes(q) ||
        (r.user_email ?? "").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [responders, search]);

  // ── Filter / page helpers ─────────────────────────────────────────────────
  const updateFilters = useCallback((next: Partial<Filters>) => {
    setSearch("");
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.status)     sp.set("status",     merged.status);
    if (merged.assignable) sp.set("assignable", merged.assignable);
    if (merged.perPage && merged.perPage !== DEFAULT_PAGE_SIZE)
      sp.set("per_page", String(merged.perPage));
    if (next.page !== undefined) sp.set("page", String(next.page));
    setParams(sp);
  }, [filters, setParams]);

  const clear = useCallback(() => { setSearch(""); setParams(new URLSearchParams()); }, [setParams]);

  const setPage = useCallback((page: number) => updateFilters({ page }), [updateFilters]);

  const setPageSize = useCallback(
    (size: number) => updateFilters({ perPage: size, page: undefined }),
    [updateFilters],
  );

  return (
    <>
      <PageMeta title="Responders | Sentrix Console" description="Responder roster" />
      <PageHeader
        title="Responders"
        breadcrumbs={[{ label: "Responders" }]}
        actions={<RegisterResponderButton />}
      />

      <div className="flex flex-col gap-4 pb-6">
        <ResponderFilters filters={filters} onChange={updateFilters} onClear={clear} />

        <ListToolbar
          search={search}
          onSearch={setSearch}
          visibleCount={visible.length}
          totalCount={meta?.total ?? null}
          isLoading={query.isLoading}
          pageSize={filters.perPage ?? DEFAULT_PAGE_SIZE}
          onPageSizeChange={setPageSize}
          onRefresh={() => void query.refetch()}
          connected={connected}
          placeholder="Search responders…"
          refreshLabel="Refresh responders"
        />

        <ResponderTable
          responders={visible}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
          onRowClick={(r: Responder) => navigate(`/responders/${r.id}`)}
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
