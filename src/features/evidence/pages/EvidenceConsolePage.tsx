import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import StatCard from "../../../components/shared/StatCard";
import CursorPagination, { type CursorMeta } from "../../../components/ui/pagination/CursorPagination";
import { CheckCircleIcon, FileIcon, LockIcon, TimeIcon } from "../../../icons";
import ObservationFilters from "../components/ObservationFilters";
import ObservationTable from "../components/ObservationTable";
import { useEvidenceSearch, useEvidenceStats } from "../hooks/useEvidence";
import type { EvidenceFilters } from "../api/evidence.types";

export default function EvidenceConsolePage() {
  const [filters, setFilters] = useState<EvidenceFilters>({});

  const stats = useEvidenceStats();
  const search = useEvidenceSearch(filters);

  const s = stats.data?.data;
  const meta = search.data?.meta as CursorMeta | undefined;

  // A facet change resets pagination back to the newest page.
  const update = (next: Partial<EvidenceFilters>) =>
    setFilters((f) => ({ ...f, ...next, cursor: undefined }));
  const clear = () => setFilters({});
  const setCursor = (cursor: string | null) =>
    setFilters((f) => ({ ...f, cursor: cursor ?? undefined }));

  return (
    <>
      <PageMeta title="Evidence | Sentrix Console" description="Evidence vault and observations" />
      <PageHeader title="Evidence" breadcrumbs={[{ label: "Evidence" }]} />

      <div className="mb-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Total observations"
            tone="info"
            icon={<FileIcon className="size-6" />}
            loading={stats.isLoading}
            value={(s?.total ?? 0).toLocaleString()}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Awaiting review"
            tone="warning"
            icon={<TimeIcon className="size-6" />}
            loading={stats.isLoading}
            value={s?.awaiting_review ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="On legal hold"
            tone="error"
            icon={<LockIcon className="size-6" />}
            loading={stats.isLoading}
            value={s?.on_legal_hold ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Bookmarked"
            tone="success"
            icon={<CheckCircleIcon className="size-6" />}
            loading={stats.isLoading}
            value={s?.bookmarked ?? 0}
          />
        </div>
      </div>

      <ObservationFilters filters={filters} onChange={update} onClear={clear} />

      <ObservationTable
        observations={search.data?.data ?? []}
        isLoading={search.isLoading}
        error={search.error}
        onRetry={() => void search.refetch()}
      />

      <CursorPagination meta={meta} onCursor={setCursor} />
    </>
  );
}
