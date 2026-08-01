import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import FilterText from "../../../components/shared/FilterText";
import Pagination from "../../../components/ui/pagination/Pagination";
import Can from "../../../components/shared/Can";
import { KYC_STATUS_OPTIONS } from "../components/verificationStatusTone";
import VerificationsQueueTable from "../components/VerificationsQueueTable";
import VerificationDetailModal from "../components/VerificationDetailModal";
import { useVerificationsQueue } from "../hooks/useVerificationsQueue";
import type { KycVerification } from "../api/verifications.types";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

/**
 * Sentrix Console (platform-staff) — cross-user KYC submission visibility.
 * Gated on verifications.view. Read-only by design: there is no triage/
 * decisioning action here (unlike SupportQueuePage's manage-gated modal
 * section) — approve/reject stays Smile ID's automated result.
 */
export default function VerificationsQueuePage() {
  const [status, setStatus] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<KycVerification | null>(null);

  const query = useVerificationsQueue({ status, country, page });
  const meta = query.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <PageMeta title="KYC Review | Sentrix Console" description="Cross-user identity verification review" />
      <PageHeader
        title="KYC Review"
        breadcrumbs={[{ label: "SuperAdmin", to: "/superadmin" }, { label: "KYC Review" }]}
      />

      <Can
        permission="verifications.view"
        fallback={<p className="text-theme-sm text-gray-400">You do not have permission to view KYC submissions.</p>}
      >
        <FilterBar
          trailing={
            (status || country) && (
              <button
                onClick={() => {
                  setStatus("");
                  setCountry("");
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
            options={KYC_STATUS_OPTIONS}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
          <FilterText
            label="Country"
            value={country}
            placeholder="e.g. NG"
            onChange={(v) => {
              setCountry(v);
              setPage(1);
            }}
          />
        </FilterBar>

        <VerificationsQueueTable
          verifications={query.data?.data ?? []}
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

        <VerificationDetailModal verification={selected} onClose={() => setSelected(null)} />
      </Can>
    </>
  );
}
