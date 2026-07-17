import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import Pagination from "../../../components/ui/pagination/Pagination";
import Can from "../../../components/shared/Can";
import SubscriptionsOverviewTable from "../components/SubscriptionsOverviewTable";
import { usePlatformSubscriptions } from "../../billing/hooks/useBilling";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "cancelled", label: "Cancelled" },
];

/**
 * Sentrix Console — cross-tenant subscription oversight: which organizations
 * are free / trialing / active (paid) / cancelled. SuperAdmin only,
 * deliberately not delegated to any PlatformRole (see
 * PlatformSubscriptionController).
 */
export default function SubscriptionsOverviewPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const query = usePlatformSubscriptions({ status: status || undefined, page });
  const meta = query.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <PageMeta title="Subscriptions | Sentrix Console" description="Cross-tenant subscription oversight" />
      <PageHeader
        title="Subscriptions"
        breadcrumbs={[{ label: "SuperAdmin", to: "/superadmin" }, { label: "Subscriptions" }]}
      />

      <Can
        superAdminOnly
        fallback={<p className="text-theme-sm text-gray-400">You do not have permission to view this.</p>}
      >
        <FilterBar
          trailing={
            status && (
              <button
                onClick={() => {
                  setStatus("");
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
            options={STATUS_OPTIONS}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
        </FilterBar>

        <SubscriptionsOverviewTable
          rows={query.data?.data ?? []}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
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
      </Can>
    </>
  );
}
