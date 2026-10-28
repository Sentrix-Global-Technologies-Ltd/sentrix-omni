import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Tabs from "../../../components/shared/Tabs";
import Pagination from "../../../components/ui/pagination/Pagination";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import DeviceTable from "../components/DeviceTable";
import RegisterDeviceDrawer from "../components/RegisterDeviceDrawer";
import { useDevices } from "../hooks/useHardware";
import BridgeTable from "../../site-bridges/components/BridgeTable";
import OnboardBridgeButton from "../../site-bridges/components/OnboardBridgeButton";
import { useSiteBridges } from "../../site-bridges/hooks/useSiteBridges";
import CameraFeedGrid from "../../camera-feeds/components/CameraFeedGrid";
import { useCameraFeeds } from "../../camera-feeds/hooks/useCameraFeeds";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

export default function HardwareConsolePage() {
  const [tab, setTab] = useState("devices");
  const [page, setPage] = useState(1);
  const [bridgePage, setBridgePage] = useState(1);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [excludeRetired, setExcludeRetired] = useState(true);

  const query = useDevices({ page, excludeRetired });
  const bridges = useSiteBridges({ page: bridgePage });
  const feeds = useCameraFeeds({});

  const meta = query.data?.meta as PaginatorMeta | undefined;
  const bridgesMeta = bridges.data?.meta as PaginatorMeta | undefined;

  /** The Register Device button — gated by hardware.register permission. */
  const registerAction = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setExcludeRetired((v) => !v)}
        className={[
          "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
          excludeRetired
            ? "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/5"
            : "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600",
        ].join(" ")}
        aria-pressed={!excludeRetired}
      >
        {excludeRetired ? "Show retired" : "Hide retired"}
      </button>
      <Can permission="hardware.register">
        <Button size="sm" variant="primary" onClick={() => setRegisterOpen(true)}>
          Register device
        </Button>
      </Can>
    </div>
  );

  return (
    <>
      <PageMeta title="Hardware | Sentrix Console" description="Device fleet, Site Bridges and Live Feeds" />
      <PageHeader
        title="Hardware"
        breadcrumbs={[{ label: "Hardware" }]}
        actions={
          tab === "devices"
            ? registerAction
            : tab === "bridges"
            ? <OnboardBridgeButton />
            : undefined
        }
      />

      <Tabs
        tabs={[
          { key: "devices", label: "Devices" },
          { key: "bridges", label: "Site Bridges" },
          { key: "feeds", label: "Live Feeds" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "devices" && (
        <>
          <DeviceTable
            devices={query.data?.data ?? []}
            isLoading={query.isLoading}
            error={query.error}
            onRetry={() => void query.refetch()}
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
        </>
      )}

      {tab === "bridges" && (
        <>
          <BridgeTable
            bridges={bridges.data?.data ?? []}
            isLoading={bridges.isLoading}
            error={bridges.error}
            onRetry={() => void bridges.refetch()}
          />

          {bridgesMeta && (
            <Pagination
              currentPage={bridgesMeta.current_page ?? 1}
              lastPage={bridgesMeta.last_page ?? 1}
              total={bridgesMeta.total}
              from={bridgesMeta.from}
              to={bridgesMeta.to}
              onPageChange={setBridgePage}
            />
          )}
        </>
      )}

      {tab === "feeds" && (
        <CameraFeedGrid
          sources={feeds.data?.data ?? []}
          isLoading={feeds.isLoading}
          error={feeds.error}
          onRetry={() => void feeds.refetch()}
        />
      )}

      <RegisterDeviceDrawer open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </>
  );
}
