import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Tabs from "../../../components/shared/Tabs";
import Pagination from "../../../components/ui/pagination/Pagination";
import PolicyTable from "../components/PolicyTable";
import ClaimTable from "../components/ClaimTable";
import CreatePolicyButton from "../components/CreatePolicyButton";
import FileClaimButton from "../components/FileClaimButton";
import GetQuoteButton from "../components/GetQuoteButton";
import { humanize } from "../components/insuranceTone";
import { useClaims, useInsuranceRisk, usePolicies } from "../hooks/useInsurance";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

export default function InsuranceConsolePage() {
  const [tab, setTab] = useState("policies");
  const [policyPage, setPolicyPage] = useState(1);
  const [claimPage, setClaimPage] = useState(1);

  const risk = useInsuranceRisk();
  const policies = usePolicies({ page: policyPage });
  const claims = useClaims({ page: claimPage });

  const policiesMeta = policies.data?.meta as PaginatorMeta | undefined;
  const claimsMeta = claims.data?.meta as PaginatorMeta | undefined;

  // Risk profile is a computed object — render its scalar fields generically.
  const riskEntries = Object.entries(risk.data?.data ?? {}).filter(
    ([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean",
  );

  return (
    <>
      <PageMeta title="Insurance | Sentrix Console" description="Risk, policies, and claims" />
      <PageHeader
        title="Insurance"
        breadcrumbs={[{ label: "Insurance" }]}
        actions={tab === "policies" ? <CreatePolicyButton /> : <FileClaimButton />}
      />

      {riskEntries.length > 0 && (
        <div className={`${card} mb-6`}>
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Risk profile</h3>
            <GetQuoteButton />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {riskEntries.map(([k, v]) => (
              <div key={k}>
                <dt className="text-theme-xs text-gray-400">{humanize(k)}</dt>
                <dd className="mt-0.5 font-medium text-gray-800 dark:text-white/90">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <Tabs
        tabs={[
          { key: "policies", label: "Policies" },
          { key: "claims", label: "Claims" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "policies" && (
        <>
          <PolicyTable
            policies={policies.data?.data ?? []}
            isLoading={policies.isLoading}
            error={policies.error}
            onRetry={() => void policies.refetch()}
          />
          {policiesMeta && (
            <Pagination
              currentPage={policiesMeta.current_page ?? 1}
              lastPage={policiesMeta.last_page ?? 1}
              total={policiesMeta.total}
              from={policiesMeta.from}
              to={policiesMeta.to}
              onPageChange={setPolicyPage}
            />
          )}
        </>
      )}

      {tab === "claims" && (
        <>
          <ClaimTable
            claims={claims.data?.data ?? []}
            isLoading={claims.isLoading}
            error={claims.error}
            onRetry={() => void claims.refetch()}
          />
          {claimsMeta && (
            <Pagination
              currentPage={claimsMeta.current_page ?? 1}
              lastPage={claimsMeta.last_page ?? 1}
              total={claimsMeta.total}
              from={claimsMeta.from}
              to={claimsMeta.to}
              onPageChange={setClaimPage}
            />
          )}
        </>
      )}
    </>
  );
}
