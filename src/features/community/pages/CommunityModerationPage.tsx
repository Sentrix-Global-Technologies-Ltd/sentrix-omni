import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import FilterText from "../../../components/shared/FilterText";
import Pagination from "../../../components/ui/pagination/Pagination";
import Can from "../../../components/shared/Can";
import {
  COMMUNITY_ANONYMOUS_OPTIONS,
  COMMUNITY_SOURCE_OPTIONS,
  COMMUNITY_STATUS_OPTIONS,
} from "../components/communityTone";
import CommunityAlertsTable from "../components/CommunityAlertsTable";
import CommunityAlertDetailModal from "../components/CommunityAlertDetailModal";
import { useCommunityAlerts } from "../hooks/useCommunityAlerts";
import type { PlatformCommunityAlert } from "../api/community.types";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

/**
 * Sentrix Console (platform-staff) — visibility and moderation over
 * crowdsourced community alerts across every reporter. Gated on
 * community.view; the resolve/remove-comment actions inside the detail
 * modal are separately gated on community.manage (mirrors RoadRiskPage's
 * view/manage split).
 */
export default function CommunityModerationPage() {
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [isAnonymous, setIsAnonymous] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PlatformCommunityAlert | null>(null);

  const query = useCommunityAlerts({
    status: status || undefined,
    source: source || undefined,
    is_anonymous: isAnonymous === "" ? undefined : isAnonymous === "true",
    search,
    page,
  });
  const meta = query.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <PageMeta title="Community | Sentrix Console" description="Crowdsourced community alert moderation" />
      <PageHeader
        title="Community"
        breadcrumbs={[{ label: "SuperAdmin", to: "/superadmin" }, { label: "Community" }]}
      />

      <Can
        permission="community.view"
        fallback={<p className="text-theme-sm text-gray-400">You do not have permission to view community reports.</p>}
      >
        <FilterBar
          trailing={
            (status || source || isAnonymous || search) && (
              <button
                onClick={() => {
                  setStatus("");
                  setSource("");
                  setIsAnonymous("");
                  setSearch("");
                  setPage(1);
                }}
                className="text-theme-sm font-medium text-brand-500 hover:underline"
              >
                Clear filters
              </button>
            )
          }
        >
          <FilterText
            label="Search"
            value={search}
            placeholder="Title or details"
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <FilterSelect
            label="Status"
            value={status}
            options={COMMUNITY_STATUS_OPTIONS}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
          <FilterSelect
            label="Source"
            value={source}
            options={COMMUNITY_SOURCE_OPTIONS}
            onChange={(v) => {
              setSource(v);
              setPage(1);
            }}
          />
          <FilterSelect
            label="Reporting"
            value={isAnonymous}
            options={COMMUNITY_ANONYMOUS_OPTIONS}
            onChange={(v) => {
              setIsAnonymous(v);
              setPage(1);
            }}
          />
        </FilterBar>

        <CommunityAlertsTable
          alerts={query.data?.data ?? []}
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

        <CommunityAlertDetailModal
          alert={selected}
          isOpen={selected !== null}
          onClose={() => setSelected(null)}
        />
      </Can>
    </>
  );
}
