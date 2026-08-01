import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Tabs from "../../../components/shared/Tabs";
import FilterBar from "../../../components/shared/FilterBar";
import FilterText from "../../../components/shared/FilterText";
import Pagination from "../../../components/ui/pagination/Pagination";
import Can from "../../../components/shared/Can";
import ConsumerSourcesTable from "../components/ConsumerSourcesTable";
import ConsumerMediaTable from "../components/ConsumerMediaTable";
import ConsumerMediaDetailModal from "../components/ConsumerMediaDetailModal";
import { useConsumerMedia, useConsumerSources } from "../hooks/useConsumerVision";
import type { ConsumerMediaAsset } from "../api/consumer-vision.types";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

/**
 * Sentrix Console (platform-staff) — cross-user visibility into consumer
 * (personal) VisionGuard camera sources and uploaded evidence. Gated on
 * vision-guard.consumer.view. Read-only: unlike Site Bridges (Hardware
 * console), there is no onboard/activate/suspend action here — a consumer's
 * own sources/media are only ever managed from their own device.
 *
 * Two tabs, one page, mirroring HardwareConsolePage's Devices/Bridges/Feeds
 * tab group — Sources (the registered device) and Evidence (the uploaded
 * media itself) are related but distinct lists, same split as the org-owned
 * side (Live Feeds vs. the Evidence console).
 */
export default function ConsumerVisionPage() {
  const [tab, setTab] = useState("sources");
  const [userId, setUserId] = useState("");
  const [sourcesPage, setSourcesPage] = useState(1);
  const [mediaPage, setMediaPage] = useState(1);
  const [selected, setSelected] = useState<ConsumerMediaAsset | null>(null);

  const sources = useConsumerSources({ user_id: userId, page: sourcesPage });
  const media = useConsumerMedia({ user_id: userId, page: mediaPage });

  const sourcesMeta = sources.data?.meta as PaginatorMeta | undefined;
  const mediaMeta = media.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <PageMeta title="Personal Evidence | Sentrix Console" description="Cross-user consumer camera sources and evidence" />
      <PageHeader
        title="Personal Evidence"
        breadcrumbs={[{ label: "SuperAdmin", to: "/superadmin" }, { label: "Personal Evidence" }]}
      />

      <Can
        permission="vision-guard.consumer.view"
        fallback={<p className="text-theme-sm text-gray-400">You do not have permission to view this.</p>}
      >
        <Tabs
          tabs={[
            { key: "sources", label: "Sources" },
            { key: "evidence", label: "Evidence" },
          ]}
          active={tab}
          onChange={setTab}
        />

        <FilterBar
          trailing={
            userId && (
              <button
                onClick={() => {
                  setUserId("");
                  setSourcesPage(1);
                  setMediaPage(1);
                }}
                className="text-theme-sm font-medium text-brand-500 hover:underline"
              >
                Clear filter
              </button>
            )
          }
        >
          <FilterText
            label="User ID"
            value={userId}
            placeholder="Filter by user UUID"
            onChange={(v) => {
              setUserId(v);
              setSourcesPage(1);
              setMediaPage(1);
            }}
          />
        </FilterBar>

        {tab === "sources" && (
          <>
            <ConsumerSourcesTable
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
                onPageChange={setSourcesPage}
              />
            )}
          </>
        )}

        {tab === "evidence" && (
          <>
            <ConsumerMediaTable
              media={media.data?.data ?? []}
              isLoading={media.isLoading}
              error={media.error}
              onRetry={() => void media.refetch()}
              onRowClick={setSelected}
            />
            {mediaMeta && (
              <Pagination
                currentPage={mediaMeta.current_page ?? 1}
                lastPage={mediaMeta.last_page ?? 1}
                total={mediaMeta.total}
                from={mediaMeta.from}
                to={mediaMeta.to}
                onPageChange={setMediaPage}
              />
            )}
          </>
        )}

        <ConsumerMediaDetailModal asset={selected} onClose={() => setSelected(null)} />
      </Can>
    </>
  );
}
