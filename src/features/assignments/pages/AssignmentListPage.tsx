import { useNavigate, useSearchParams, Link } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Pagination from "../../../components/ui/pagination/Pagination";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
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

export default function AssignmentListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filters: Filters = {
    status: params.get("status") ?? undefined,
    incident_id: params.get("incident_id") ?? undefined,
    page: params.get("page") ? Number(params.get("page")) : undefined,
  };

  const { connected } = useAssignmentsRealtime();
  const query = useAssignments(filters);

  // Status is set via the control; incident_id is preserved (deep-link scope).
  const updateFilters = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.status) sp.set("status", merged.status);
    if (merged.incident_id) sp.set("incident_id", merged.incident_id);
    setParams(sp);
  };

  const clearStatus = () => updateFilters({ status: undefined });

  const clearIncidentScope = () => {
    const sp = new URLSearchParams(params);
    sp.delete("incident_id");
    setParams(sp);
  };

  const setPage = (page: number) => {
    const sp = new URLSearchParams(params);
    sp.set("page", String(page));
    setParams(sp);
  };

  const assignments = query.data?.data ?? [];
  const meta = query.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <PageMeta title="Assignments | Sentrix Console" description="Dispatch assignments" />
      <PageHeader
        title="Assignments"
        breadcrumbs={[{ label: "Assignments" }]}
        actions={<RealtimeIndicator connected={connected} />}
      />

      {filters.incident_id && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm dark:border-brand-500/30 dark:bg-brand-500/10">
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

      <AssignmentTable
        assignments={assignments}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onRowClick={(a: Assignment) => navigate(`/assignments/${a.id}`)}
      />

      {meta && (
        <Pagination
          currentPage={meta.current_page ?? 1}
          lastPage={meta.last_page ?? 1}
          total={meta.total}
          from={meta.from}
          to={meta.to}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
