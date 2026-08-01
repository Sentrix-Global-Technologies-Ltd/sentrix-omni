import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import FilterText from "../../../components/shared/FilterText";
import FilterBar from "../../../components/shared/FilterBar";
import { useCameraFeeds } from "../hooks/useCameraFeeds";
import CameraFeedGrid from "../components/CameraFeedGrid";

/**
 * Live Monitoring — the full-page version of the camera-wall (the Dashboard
 * home widget and Hardware's "Live Feeds" tab show the same underlying data
 * in smaller/embedded form). Real-time: polls at the same cadence
 * useCameraFeeds already uses elsewhere.
 */
export default function LiveMonitoringPage() {
  const [site, setSite] = useState("");
  const feeds = useCameraFeeds({ site });

  return (
    <>
      <PageMeta title="Live Monitoring | Sentrix Console" description="Real-time camera feeds across your sites" />
      <PageHeader title="Live Monitoring" breadcrumbs={[{ label: "Vision Guard" }, { label: "Live Monitoring" }]} />

      <FilterBar>
        <FilterText label="Site" value={site} placeholder="Filter by site…" onChange={setSite} />
      </FilterBar>

      <CameraFeedGrid
        sources={feeds.data?.data ?? []}
        isLoading={feeds.isLoading}
        error={feeds.error}
        onRetry={() => void feeds.refetch()}
      />
    </>
  );
}
