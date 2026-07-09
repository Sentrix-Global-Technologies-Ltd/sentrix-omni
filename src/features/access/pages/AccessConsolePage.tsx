import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Tabs from "../../../components/shared/Tabs";
import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import Button from "../../../components/ui/button/Button";
import Pagination from "../../../components/ui/pagination/Pagination";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import PassTable from "../components/PassTable";
import GateTable from "../components/GateTable";
import IssuePassButton from "../components/IssuePassButton";
import { LogGateEntryButton, ScanGateButton } from "../components/GateActions";
import { GATE_RESULT_OPTIONS, PASS_STATUS_OPTIONS } from "../components/accessTone";
import { useGateEvents, usePasses } from "../hooks/useAccess";
import { useAccessRealtime } from "../hooks/useAccessRealtime";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

export default function AccessConsolePage() {
  const [tab, setTab] = useState("passes");
  const [status, setStatus] = useState("");
  const [passPage, setPassPage] = useState(1);
  const [result, setResult] = useState("");
  const [gatePage, setGatePage] = useState(1);

  const passes = usePasses({ status: status || undefined, page: passPage });
  const gate = useGateEvents({ result: result || undefined, page: gatePage });
  const { connected } = useAccessRealtime();

  const passesMeta = passes.data?.meta as PaginatorMeta | undefined;
  const gateMeta = gate.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <PageMeta title="Access | Sentrix Console" description="Visitor passes and gate activity" />
      <PageHeader
        title="Access Control"
        breadcrumbs={[{ label: "Access" }]}
        actions={
          <div className="flex items-center gap-2">
            <RealtimeIndicator connected={connected} />
            {tab === "passes" ? (
              <IssuePassButton />
            ) : (
              <>
                <LogGateEntryButton />
                <ScanGateButton />
              </>
            )}
          </div>
        }
      />

      <Tabs
        tabs={[
          { key: "passes", label: "Passes" },
          { key: "gate", label: "Gate log" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "passes" && (
        <>
          <FilterBar
            trailing={
              status ? (
                <Button size="sm" variant="outline" onClick={() => { setStatus(""); setPassPage(1); }}>
                  Clear
                </Button>
              ) : undefined
            }
          >
            <FilterSelect
              label="Status"
              value={status}
              options={PASS_STATUS_OPTIONS}
              placeholder="All statuses"
              onChange={(v) => { setStatus(v); setPassPage(1); }}
            />
          </FilterBar>

          <PassTable
            passes={passes.data?.data ?? []}
            isLoading={passes.isLoading}
            error={passes.error}
            onRetry={() => void passes.refetch()}
          />

          {passesMeta && (
            <Pagination
              currentPage={passesMeta.current_page ?? 1}
              lastPage={passesMeta.last_page ?? 1}
              total={passesMeta.total}
              from={passesMeta.from}
              to={passesMeta.to}
              onPageChange={setPassPage}
            />
          )}
        </>
      )}

      {tab === "gate" && (
        <>
          <FilterBar
            trailing={
              result ? (
                <Button size="sm" variant="outline" onClick={() => { setResult(""); setGatePage(1); }}>
                  Clear
                </Button>
              ) : undefined
            }
          >
            <FilterSelect
              label="Result"
              value={result}
              options={GATE_RESULT_OPTIONS}
              placeholder="All results"
              onChange={(v) => { setResult(v); setGatePage(1); }}
            />
          </FilterBar>

          <GateTable
            events={gate.data?.data ?? []}
            isLoading={gate.isLoading}
            error={gate.error}
            onRetry={() => void gate.refetch()}
          />

          {gateMeta && (
            <Pagination
              currentPage={gateMeta.current_page ?? 1}
              lastPage={gateMeta.last_page ?? 1}
              total={gateMeta.total}
              from={gateMeta.from}
              to={gateMeta.to}
              onPageChange={setGatePage}
            />
          )}
        </>
      )}
    </>
  );
}
