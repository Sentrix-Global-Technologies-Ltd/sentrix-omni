import { useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Pagination from "../../../components/ui/pagination/Pagination";
import LeadFilters from "../components/LeadFilters";
import LeadTable from "../components/LeadTable";
import CreateLeadButton from "../components/CreateLeadButton";
import { useLeads } from "../hooks/useLeads";
import type { Lead, LeadFilters as Filters } from "../api/leads.types";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

export default function LeadListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filters: Filters = {
    stage: params.get("stage") ?? undefined,
    client_type: params.get("client_type") ?? undefined,
    page: params.get("page") ? Number(params.get("page")) : undefined,
  };

  const query = useLeads(filters);

  const updateFilters = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.stage) sp.set("stage", merged.stage);
    if (merged.client_type) sp.set("client_type", merged.client_type);
    setParams(sp);
  };

  const clear = () => setParams(new URLSearchParams());

  const setPage = (page: number) => {
    const sp = new URLSearchParams(params);
    sp.set("page", String(page));
    setParams(sp);
  };

  const leads = query.data?.data ?? [];
  const meta = query.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <PageMeta title="Leads | Sentrix Console" description="CRM pipeline" />
      <PageHeader
        title="Leads"
        breadcrumbs={[{ label: "SuperAdmin", to: "/superadmin" }, { label: "Leads" }]}
        actions={<CreateLeadButton />}
      />

      <LeadFilters filters={filters} onChange={updateFilters} onClear={clear} />

      <LeadTable
        leads={leads}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onRowClick={(l: Lead) => navigate(`/superadmin/leads/${l.id}`)}
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
