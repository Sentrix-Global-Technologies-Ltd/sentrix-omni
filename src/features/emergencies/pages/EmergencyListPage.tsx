import { useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Pagination from "../../../components/ui/pagination/Pagination";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
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

export default function EmergencyListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filters: Filters = {
    status: params.get("status") ?? undefined,
    severity: params.get("severity") ?? undefined,
    page: params.get("page") ? Number(params.get("page")) : undefined,
  };

  const { connected } = useEmergenciesRealtime();
  const query = useEmergencies(filters);

  const updateFilters = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.status) sp.set("status", merged.status);
    if (merged.severity) sp.set("severity", merged.severity);
    setParams(sp);
  };

  const clear = () => setParams(new URLSearchParams());

  const setPage = (page: number) => {
    const sp = new URLSearchParams(params);
    sp.set("page", String(page));
    setParams(sp);
  };

  const emergencies = query.data?.data ?? [];
  const meta = query.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <PageMeta title="Emergencies | Sentrix Console" description="Emergency coordination" />
      <PageHeader
        title="Emergencies"
        breadcrumbs={[{ label: "Emergencies" }]}
        actions={<RealtimeIndicator connected={connected} />}
      />

      <EmergencyFilters filters={filters} onChange={updateFilters} onClear={clear} />

      <EmergencyTable
        emergencies={emergencies}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onRowClick={(e: Emergency) => navigate(`/emergencies/${e.id}`)}
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
