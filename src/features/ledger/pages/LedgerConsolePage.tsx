import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import StatCard from "../../../components/shared/StatCard";
import Tabs from "../../../components/shared/Tabs";
import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import Button from "../../../components/ui/button/Button";
import Pagination from "../../../components/ui/pagination/Pagination";
import { BoxIconLine, CheckCircleIcon, DollarLineIcon } from "../../../icons";
import SourceTable from "../components/SourceTable";
import WriteTable from "../components/WriteTable";
import OnboardSourceButton from "../components/OnboardSourceButton";
import { SOURCE_STATUS_OPTIONS } from "../components/ledgerTone";
import { useLedgerSources, useLedgerStats, useLedgerWrites } from "../hooks/useLedger";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

export default function LedgerConsolePage() {
  const [tab, setTab] = useState("sources");
  const [status, setStatus] = useState<string>("");
  const [sourcePage, setSourcePage] = useState(1);
  const [writePage, setWritePage] = useState(1);

  const stats = useLedgerStats();
  const sources = useLedgerSources({ status: status || undefined, page: sourcePage });
  const writes = useLedgerWrites({ page: writePage });

  const s = stats.data?.data;
  const sourcesMeta = sources.data?.meta as PaginatorMeta | undefined;
  const writesMeta = writes.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <PageMeta title="Ledger | Sentrix Console" description="Financial ledger sources and writes" />
      <PageHeader
        title="Ledger"
        breadcrumbs={[{ label: "SuperAdmin", to: "/superadmin" }, { label: "Ledger" }]}
      />

      <div className="mb-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            label="Total writes"
            tone="primary"
            icon={<DollarLineIcon className="size-6" />}
            loading={stats.isLoading}
            value={(s?.total_writes ?? 0).toLocaleString()}
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            label="Active sources"
            tone="success"
            icon={<CheckCircleIcon className="size-6" />}
            loading={stats.isLoading}
            value={s?.active_sources ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            label="Total sources"
            tone="info"
            icon={<BoxIconLine className="size-6" />}
            loading={stats.isLoading}
            value={s?.source_count ?? 0}
          />
        </div>
      </div>

      <Tabs
        tabs={[
          { key: "sources", label: "Sources" },
          { key: "writes", label: "Writes" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "sources" && (
        <>
          <div className="mb-3 flex justify-end">
            <OnboardSourceButton />
          </div>
          <FilterBar
            trailing={
              status ? (
                <Button size="sm" variant="outline" onClick={() => { setStatus(""); setSourcePage(1); }}>
                  Clear
                </Button>
              ) : undefined
            }
          >
            <FilterSelect
              label="Status"
              value={status}
              options={SOURCE_STATUS_OPTIONS}
              placeholder="All statuses"
              onChange={(v) => { setStatus(v); setSourcePage(1); }}
            />
          </FilterBar>

          <SourceTable
            sources={sources.data?.data ?? []}
            isLoading={sources.isLoading}
            error={sources.error}
            onRetry={() => void sources.refetch()}
          />

          {sourcesMeta && (
            <Pagination
              currentPage={sourcesMeta.current_page ?? 1}
              lastPage={sourcesMeta.last_page ?? 1}
              total={sourcesMeta.total}
              from={sourcesMeta.from}
              to={sourcesMeta.to}
              onPageChange={setSourcePage}
            />
          )}
        </>
      )}

      {tab === "writes" && (
        <>
          <WriteTable
            writes={writes.data?.data ?? []}
            isLoading={writes.isLoading}
            error={writes.error}
            onRetry={() => void writes.refetch()}
          />

          {writesMeta && (
            <Pagination
              currentPage={writesMeta.current_page ?? 1}
              lastPage={writesMeta.last_page ?? 1}
              total={writesMeta.total}
              from={writesMeta.from}
              to={writesMeta.to}
              onPageChange={setWritePage}
            />
          )}
        </>
      )}
    </>
  );
}
