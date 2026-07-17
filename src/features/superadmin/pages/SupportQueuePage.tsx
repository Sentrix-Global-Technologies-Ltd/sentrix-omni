import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import FilterText from "../../../components/shared/FilterText";
import Pagination from "../../../components/ui/pagination/Pagination";
import Can from "../../../components/shared/Can";
import { SUPPORT_TICKET_STATUS_OPTIONS } from "../../support/components/supportTicketTone";
import SupportQueueTable from "../components/SupportQueueTable";
import TriageTicketModal from "../components/TriageTicketModal";
import { useSupportQueue } from "../hooks/useSupportQueue";
import type { SupportTicket } from "../../support/api/support.types";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

/**
 * Sentrix Console (platform-staff) — cross-tenant support ticket triage.
 * Gated on support.tickets.view; write actions inside the triage modal are
 * separately gated on support.tickets.manage (see TriageTicketModal).
 */
export default function SupportQueuePage() {
  const [status, setStatus] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SupportTicket | null>(null);

  const query = useSupportQueue({ status, organization_id: organizationId, page });
  const meta = query.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <PageMeta title="Support Queue | Sentrix Console" description="Cross-tenant support ticket triage" />
      <PageHeader
        title="Support Queue"
        breadcrumbs={[{ label: "SuperAdmin", to: "/superadmin" }, { label: "Support Queue" }]}
      />

      <Can
        permission="support.tickets.view"
        fallback={<p className="text-theme-sm text-gray-400">You do not have permission to view support tickets.</p>}
      >
        <FilterBar
          trailing={
            (status || organizationId) && (
              <button
                onClick={() => {
                  setStatus("");
                  setOrganizationId("");
                  setPage(1);
                }}
                className="text-theme-sm font-medium text-brand-500 hover:underline"
              >
                Clear filters
              </button>
            )
          }
        >
          <FilterSelect
            label="Status"
            value={status}
            options={SUPPORT_TICKET_STATUS_OPTIONS}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
          <FilterText
            label="Organization ID"
            value={organizationId}
            placeholder="Filter by organization UUID"
            onChange={(v) => {
              setOrganizationId(v);
              setPage(1);
            }}
          />
        </FilterBar>

        <SupportQueueTable
          tickets={query.data?.data ?? []}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
          onRowClick={setSelected}
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

        <TriageTicketModal ticket={selected} onClose={() => setSelected(null)} />
      </Can>
    </>
  );
}
