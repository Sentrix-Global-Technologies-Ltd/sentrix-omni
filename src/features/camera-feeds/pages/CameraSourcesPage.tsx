import { useMemo, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import FilterBar from "../../../components/shared/FilterBar";
import FilterText from "../../../components/shared/FilterText";
import FilterSelect from "../../../components/shared/FilterSelect";
import StatCard from "../../../components/shared/StatCard";
import Pagination from "../../../components/ui/pagination/Pagination";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import { useToast } from "../../../components/shared/toast";
import { VideoIcon, CheckCircleIcon, AlertIcon, TimeIcon } from "../../../icons";
import { useCameraFeeds } from "../hooks/useCameraFeeds";
import { useDeleteCameraSource } from "../hooks/useCameraSourceActions";
import CameraSourcesTable from "../components/CameraSourcesTable";
import AddCameraSourceModal from "../components/AddCameraSourceModal";
import { CAMERA_SOURCE_TYPES } from "../components/cameraSourceTypeMeta";
import type { CameraSource } from "../api/camera-feeds.types";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

/**
 * Full Camera Sources console: every registered camera source across the
 * organization (bridge-discovered, org-admin-registered, or a consumer's
 * personal upload isn't included here — this is org-owned rows only), with
 * real filters, a health/connection view, and the "Add Camera Source" flow.
 * Distinct from Hardware's "Live Feeds" tab, which is the same data read-only
 * inside the broader Hardware console — this is the dedicated management
 * surface under the Vision Guard nav section.
 */
export default function CameraSourcesPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);

  const query = useCameraFeeds({ q, type, status, page });
  const del = useDeleteCameraSource();
  const toast = useToast();

  const sources = useMemo(() => query.data?.data ?? [], [query.data]);
  const meta = query.data?.meta as PaginatorMeta | undefined;

  const total = meta?.total ?? sources.length;
  const online = sources.filter((s) => s.feed_status === "live").length;
  const offline = sources.filter((s) => s.feed_status === "offline" || s.feed_status === "no_feed").length;
  const stale = sources.filter((s) => s.feed_status === "stale").length;

  const handleDelete = async (source: CameraSource) => {
    if (!window.confirm(`Remove "${source.label}"? This cannot be undone.`)) return;
    try {
      await del.mutateAsync(source.id);
      toast.success(`${source.label} removed.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove camera source.");
    }
  };

  return (
    <>
      <PageMeta title="Camera Sources | Sentrix Console" description="Manage and monitor all camera sources" />
      <PageHeader
        title="Camera Sources"
        breadcrumbs={[{ label: "Vision Guard" }, { label: "Camera Sources" }]}
        actions={
          <Can permission="bridges.manage">
            <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}>
              Add Camera Source
            </Button>
          </Can>
        }
      />

      <div className="mb-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard label="Total Sources" tone="info" icon={<VideoIcon className="size-6" />} value={total} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard label="Online" tone="success" icon={<CheckCircleIcon className="size-6" />} value={online} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard label="Stale" tone="warning" icon={<TimeIcon className="size-6" />} value={stale} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard label="Offline" tone="error" icon={<AlertIcon className="size-6" />} value={offline} />
        </div>
      </div>

      <FilterBar
        trailing={
          (q || type || status) && (
            <button
              onClick={() => {
                setQ("");
                setType("");
                setStatus("");
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
          value={q}
          placeholder="Search sources…"
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
        />
        <FilterSelect
          label="Source Type"
          value={type}
          options={CAMERA_SOURCE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          onChange={(v) => {
            setType(v);
            setPage(1);
          }}
        />
        <FilterSelect
          label="Status"
          value={status}
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
      </FilterBar>

      <CameraSourcesTable
        sources={sources}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onDelete={(s) => void handleDelete(s)}
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

      <AddCameraSourceModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
