import { useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Pagination from "../../../components/ui/pagination/Pagination";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import ResponderFilters from "../components/ResponderFilters";
import ResponderTable from "../components/ResponderTable";
import RegisterResponderButton from "../components/RegisterResponderButton";
import { useResponders } from "../hooks/useResponders";
import { useRespondersRealtime } from "../hooks/useRespondersRealtime";
import type { Responder, ResponderFilters as Filters } from "../api/responders.types";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

export default function ResponderListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filters: Filters = {
    status: params.get("status") ?? undefined,
    assignable: params.get("assignable") ?? undefined,
    page: params.get("page") ? Number(params.get("page")) : undefined,
  };

  const { connected } = useRespondersRealtime();
  const query = useResponders(filters);

  const updateFilters = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.status) sp.set("status", merged.status);
    if (merged.assignable) sp.set("assignable", merged.assignable);
    setParams(sp);
  };

  const clear = () => setParams(new URLSearchParams());

  const setPage = (page: number) => {
    const sp = new URLSearchParams(params);
    sp.set("page", String(page));
    setParams(sp);
  };

  const responders = query.data?.data ?? [];
  const meta = query.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <PageMeta title="Responders | Sentrix Console" description="Responder roster" />
      <PageHeader
        title="Responders"
        breadcrumbs={[{ label: "Responders" }]}
        actions={
          <div className="flex items-center gap-2">
            <RealtimeIndicator connected={connected} />
            <RegisterResponderButton />
          </div>
        }
      />

      <ResponderFilters filters={filters} onChange={updateFilters} onClear={clear} />

      <ResponderTable
        responders={responders}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onRowClick={(r: Responder) => navigate(`/responders/${r.id}`)}
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
