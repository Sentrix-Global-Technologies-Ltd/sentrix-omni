import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import StatCard from "../../../components/shared/StatCard";
import Tabs from "../../../components/shared/Tabs";
import CursorPagination, { type CursorMeta } from "../../../components/ui/pagination/CursorPagination";
import { CheckCircleIcon, FileIcon, LockIcon, TimeIcon } from "../../../icons";
import ObservationFilters from "../components/ObservationFilters";
import ObservationTable from "../components/ObservationTable";
import CollectionsTab from "../components/CollectionsTab";
import ExportsTab from "../components/ExportsTab";
import RetentionPolicyPanel from "../components/RetentionPolicyPanel";
import EvidenceAuditTab from "../components/EvidenceAuditTab";
import CustodyModal from "../components/CustodyModal";
import { useEvidenceSearch, useEvidenceStats } from "../hooks/useEvidence";
import type { EvidenceFilters, Observation } from "../api/evidence.types";

const TABS = [
  { key: "observations", label: "Observations" },
  { key: "collections", label: "Collections" },
  { key: "exports", label: "Exports" },
  { key: "retention", label: "Retention Policy" },
  { key: "audit", label: "Audit Log" },
];

export default function EvidenceConsolePage() {
  const [tab, setTab] = useState("observations");
  const [filters, setFilters] = useState<EvidenceFilters>({});
  const [custodyTarget, setCustodyTarget] = useState<Observation | null>(null);

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
      <PageHeader title="Evidence Vault" breadcrumbs={[{ label: "Vision Guard" }, { label: "Evidence Vault" }]} />

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

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "observations" && (
        <>
          <ObservationFilters filters={filters} onChange={update} onClear={clear} />

          <ObservationTable
            observations={search.data?.data ?? []}
            isLoading={search.isLoading}
            error={search.error}
            onRetry={() => void search.refetch()}
            onViewCustody={setCustodyTarget}
          />

          <CursorPagination meta={meta} onCursor={setCursor} />
        </>
      )}

      {tab === "collections" && <CollectionsTab />}
      {tab === "exports" && <ExportsTab />}
      {tab === "retention" && <RetentionPolicyPanel />}
      {tab === "audit" && <EvidenceAuditTab />}

      <CustodyModal observation={custodyTarget} onClose={() => setCustodyTarget(null)} />
    </>
  );
}
