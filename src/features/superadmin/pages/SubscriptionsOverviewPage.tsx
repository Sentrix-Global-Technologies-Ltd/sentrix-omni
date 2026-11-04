import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import FilterText from "../../../components/shared/FilterText";
import Tabs from "../../../components/shared/Tabs";
import Pagination from "../../../components/ui/pagination/Pagination";
import Can from "../../../components/shared/Can";
import { humanize } from "../../../lib/format";
import BillingSummaryCards from "../components/BillingSummaryCards";
import BillingCustomerDetailModal, { type BillingCustomerTarget } from "../components/BillingCustomerDetailModal";
import IndividualSubscriptionsTable from "../components/IndividualSubscriptionsTable";
import SubscriptionsOverviewTable from "../components/SubscriptionsOverviewTable";
import { BILLING_STATUS_OPTIONS } from "../components/billingStatusTone";
import {
  usePlatformBillingIndividuals,
  usePlatformBillingOrganizations,
  usePlatformBillingSummary,
} from "../../billing/hooks/useBilling";
import type {
  PlatformBillingFilters,
  PlatformBillingSegment,
  PlatformBillingStatus,
} from "../../billing/api/billing.types";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

const SEGMENT_TABS: { key: PlatformBillingSegment; label: string }[] = [
  { key: "organizations", label: "Organizations" },
  { key: "individuals", label: "Individuals" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "period_end", label: "Period end" },
];

/**
 * Sentrix Console — billing & subscriptions (read-only). Customer
 * organizations and individuals with derived status (a lapsed paid plan reads
 * "expired"), payment history and invoices/receipts. SuperAdmin only,
 * deliberately not delegated to any PlatformRole; Sentrix's own Monitoring
 * organization and internal accounts are excluded by the backend.
 */
export default function SubscriptionsOverviewPage() {
  const [segment, setSegment] = useState<PlatformBillingSegment>("organizations");
  const [q, setQ] = useState("");
  const [planKey, setPlanKey] = useState("");
  const [status, setStatus] = useState<PlatformBillingStatus | "">("");
  const [sort, setSort] = useState<"name" | "period_end" | "">("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<BillingCustomerTarget | null>(null);

  const filters: PlatformBillingFilters = {
    q,
    plan_key: planKey,
    status,
    sort: sort || undefined,
    page,
  };

  const summary = usePlatformBillingSummary();
  // Only the visible segment's list is fetched.
  const organizations = usePlatformBillingOrganizations(filters, segment === "organizations");
  const individuals = usePlatformBillingIndividuals(filters, segment === "individuals");
  const active = segment === "organizations" ? organizations : individuals;
  const meta = active.data?.meta as PaginatorMeta | undefined;

  // Plan options come from the plans that actually have customers in this
  // segment (the summary), so the console never hard-codes the plan catalogue.
  const planOptions = Object.keys(summary.data?.data[segment].by_plan ?? {})
    .sort()
    .map((key) => ({ value: key, label: humanize(key) }));

  const hasFilters = Boolean(q || planKey || status || sort);

  const reset = () => {
    setQ("");
    setPlanKey("");
    setStatus("");
    setSort("");
    setPage(1);
  };

  const changeSegment = (key: string) => {
    setSegment(key as PlatformBillingSegment);
    reset();
  };

  return (
    <>
      <PageMeta title="Billing & Subscriptions | Sentrix Console" description="Customer billing and subscription oversight" />
      <PageHeader
        title="Billing & Subscriptions"
        breadcrumbs={[{ label: "SuperAdmin", to: "/superadmin" }, { label: "Billing & Subscriptions" }]}
      />

      <Can
        superAdminOnly
        fallback={<p className="text-theme-sm text-gray-400">You do not have permission to view this.</p>}
      >
        <Tabs tabs={SEGMENT_TABS} active={segment} onChange={changeSegment} />

        <BillingSummaryCards segment={segment} summary={summary.data?.data} isLoading={summary.isLoading} />

        <FilterBar
          trailing={
            hasFilters && (
              <button onClick={reset} className="text-theme-sm font-medium text-brand-500 hover:underline">
                Clear filters
              </button>
            )
          }
        >
          <FilterText
            label="Search"
            value={q}
            placeholder={segment === "organizations" ? "Name, slug or owner" : "Name, email or phone"}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
          />
          <FilterSelect
            label="Plan"
            value={planKey}
            options={planOptions}
            onChange={(v) => {
              setPlanKey(v);
              setPage(1);
            }}
          />
          <FilterSelect
            label="Status"
            value={status}
            options={BILLING_STATUS_OPTIONS}
            onChange={(v) => {
              setStatus(v as PlatformBillingStatus | "");
              setPage(1);
            }}
          />
          <FilterSelect
            label="Sort"
            value={sort}
            options={SORT_OPTIONS}
            onChange={(v) => {
              setSort(v as "name" | "period_end" | "");
              setPage(1);
            }}
          />
        </FilterBar>

        {segment === "organizations" ? (
          <SubscriptionsOverviewTable
            rows={organizations.data?.data ?? []}
            isLoading={organizations.isLoading}
            error={organizations.error}
            onRetry={() => void organizations.refetch()}
            onRowClick={(row) => setSelected({ segment: "organizations", id: row.organization_id })}
          />
        ) : (
          <IndividualSubscriptionsTable
            rows={individuals.data?.data ?? []}
            isLoading={individuals.isLoading}
            error={individuals.error}
            onRetry={() => void individuals.refetch()}
            onRowClick={(row) => setSelected({ segment: "individuals", id: row.user_id })}
          />
        )}

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

        <BillingCustomerDetailModal target={selected} onClose={() => setSelected(null)} />
      </Can>
    </>
  );
}
