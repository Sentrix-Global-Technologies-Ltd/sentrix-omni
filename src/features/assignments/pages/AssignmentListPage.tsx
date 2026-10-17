import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import ListToolbar from "../../../components/shared/ListToolbar";
import ListPagination from "../../../components/shared/ListPagination";
import AssignmentFilters from "../components/AssignmentFilters";
import AssignmentTable from "../components/AssignmentTable";
import { useAssignments } from "../hooks/useAssignments";
import { useAssignmentsRealtime } from "../hooks/useAssignmentsRealtime";
import type { Assignment, AssignmentFilters as Filters } from "../api/assignments.types";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

const DEFAULT_PAGE_SIZE = 25;

export default function AssignmentListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filters: Filters = {
    status:      params.get("status")      ?? undefined,
    incident_id: params.get("incident_id") ?? undefined,
    page:        params.get("page")        ? Number(params.get("page")) : undefined,
    per_page:    params.get("per_page")    ? Number(params.get("per_page")) : DEFAULT_PAGE_SIZE,
  };

  const { connected } = useAssignmentsRealtime();
  const query = useAssignments(filters);

  const assignments = query.data?.data ?? [];
  const meta = query.data?.meta as PaginatorMeta | undefined;

  // ── Client-side search over current page ──────────────────────────────────
  const [search, setSearch] = useState("");
  const visible = useMemo<Assignment[]>(() => {
    if (!search.trim()) return assignments;
    const q = search.toLowerCase();
    return assignments.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        (a.incident_id ?? "").toLowerCase().includes(q) ||
        (a.status ?? "").toLowerCase().includes(q),
    );
  }, [assignments, search]);

  // ── Filter / page helpers ─────────────────────────────────────────────────
  // incident_id is a deep-link scope; preserved across filter changes.
  const updateFilters = useCallback((next: Partial<Filters>) => {
    setSearch("");
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.status)      sp.set("status",      merged.status);
    if (merged.incident_id) sp.set("incident_id", merged.incident_id);
    if (merged.per_page && merged.per_page !== DEFAULT_PAGE_SIZE)
      sp.set("per_page", String(merged.per_page));
    if (next.page !== undefined) sp.set("page", String(next.page));
    setParams(sp);
  }, [filters, setParams]);

  const clearStatus = useCallback(() => updateFilters({ status: undefined }), [updateFilters]);

  const clearIncidentScope = useCallback(() => {
    const sp = new URLSearchParams(params);
    sp.delete("incident_id");
    setParams(sp);
  }, [params, setParams]);

  const setPage = useCallback((page: number) => updateFilters({ page }), [updateFilters]);

  const setPageSize = useCallback(
    (size: number) => updateFilters({ per_page: size, page: undefined }),
    [updateFilters],
  );

  return (
    <>
      <PageMeta title="Assignments | Sentrix Console" description="Dispatch assignments" />
      <PageHeader
        title="Assignments"
        breadcrumbs={[{ label: "Assignments" }]}
      />

      <div className="flex flex-col gap-4 pb-6">
        {filters.incident_id && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm dark:border-brand-500/30 dark:bg-brand-500/10">
            <span className="text-brand-700 dark:text-brand-300">
              Showing assignments for incident{" "}
              <Link to={`/incidents/${filters.incident_id}`} className="font-medium underline">
                {filters.incident_id.slice(0, 8)}
              </Link>
            </span>
            <button onClick={clearIncidentScope} className="text-brand-600 hover:underline dark:text-brand-400">
              Clear
            </button>
          </div>
        )}

        <AssignmentFilters filters={filters} onChange={updateFilters} onClear={clearStatus} />

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
          placeholder="Search assignments…"
          refreshLabel="Refresh assignments"
        />

        <AssignmentTable
          assignments={visible}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
          onRowClick={(a: Assignment) => navigate(`/assignments/${a.id}`)}
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
