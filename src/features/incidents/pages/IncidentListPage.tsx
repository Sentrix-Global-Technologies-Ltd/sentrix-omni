import { useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Pagination from "../../../components/ui/pagination/Pagination";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import Can from "../../../components/shared/Can";
import IncidentFilters from "../components/IncidentFilters";
import IncidentTable from "../components/IncidentTable";
import CreateIncidentButton from "../components/CreateIncidentButton";
import { useIncidents } from "../hooks/useIncidents";
import { useIncidentsRealtime } from "../hooks/useIncidentsRealtime";
import type { Incident, IncidentFilters as Filters } from "../api/incidents.types";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

export default function IncidentListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filters: Filters = {
    status: params.get("status") ?? undefined,
    severity: params.get("severity") ?? undefined,
    page: params.get("page") ? Number(params.get("page")) : undefined,
  };

  const { connected } = useIncidentsRealtime();
  const query = useIncidents(filters);

  const updateFilters = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.status) sp.set("status", merged.status);
    if (merged.severity) sp.set("severity", merged.severity);
    // reset pagination when filters change
    setParams(sp);
  };

  const clear = () => setParams(new URLSearchParams());

  const setPage = (page: number) => {
    const sp = new URLSearchParams(params);
    sp.set("page", String(page));
    setParams(sp);
  };

  const incidents = query.data?.data ?? [];
  const meta = query.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <PageMeta title="Incidents | Sentrix Console" description="Operational incidents" />
      <PageHeader
        title="Incidents"
        breadcrumbs={[{ label: "Incidents" }]}
        actions={
          <div className="flex items-center gap-2">
            <RealtimeIndicator connected={connected} />
            <Can permission="incidents.create">
              <CreateIncidentButton />
            </Can>
          </div>
        }
      />

      <IncidentFilters filters={filters} onChange={updateFilters} onClear={clear} />

      <IncidentTable
        incidents={incidents}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onRowClick={(incident: Incident) => navigate(`/incidents/${incident.id}`)}
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
