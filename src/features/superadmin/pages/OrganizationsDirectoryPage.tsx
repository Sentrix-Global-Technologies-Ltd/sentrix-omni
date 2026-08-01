import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import FilterBar from "../../../components/shared/FilterBar";
import FilterText from "../../../components/shared/FilterText";
import Pagination from "../../../components/ui/pagination/Pagination";
import StatCard from "../../../components/shared/StatCard";
import MapView, { type MapMarker } from "../../../components/shared/MapView";
import OrganizationsTable from "../components/OrganizationsTable";
import { usePlatformOrganizations } from "../hooks/usePlatformOrganizations";
import type { PlatformOrganization } from "../api/organizations.types";
import { GroupIcon, CheckCircleIcon, VideoIcon, AlertHexaIcon } from "../../../icons";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

// Lagos, Nigeria — Sentrix's primary market; a reasonable default view before
// any organization coordinates are known.
const DEFAULT_CENTER: [number, number] = [6.5244, 3.3792];

function subscriptionColor(status: string | null): string {
  if (status === "active") return "#12b76a";
  if (status === "trialing") return "#f79009";
  if (status === "cancelled" || status === "canceled") return "#f04438";
  return "#98a2b3";
}

/**
 * Sentrix Console (platform-staff) — every organization on the platform:
 * basic details, member/hardware/CCTV counts, subscription status, pinned on
 * a live map by their geocoded region (see OrganizationService::
 * resolveCoordinatesForRegion). Click a pin or a row to open that
 * organization's detail page. Gated on organizations.view, delegable beyond
 * SuperAdmin (OnboardingManager, SentrixEngineer).
 */
export default function OrganizationsDirectoryPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [page, setPage] = useState(1);

  const query = usePlatformOrganizations({ q, region, page, per_page: 100 });
  const organizations = useMemo(() => query.data?.data ?? [], [query.data]);
  const meta = query.data?.meta as PaginatorMeta | undefined;

  const mapped = useMemo(() => organizations.filter((o) => o.lat != null && o.lng != null), [organizations]);

  const markers = useMemo<MapMarker[]>(
    () =>
      mapped.map((o) => ({
        id: o.id,
        lat: o.lat as number,
        lng: o.lng as number,
        color: subscriptionColor(o.subscription_status),
        label: `${o.name}${o.region ? ` — ${o.region}` : ""}`,
      })),
    [mapped],
  );

  const mapCenter: [number, number] =
    mapped.length > 0 ? [mapped[0].lat as number, mapped[0].lng as number] : DEFAULT_CENTER;

  const goToDetail = (o: Pick<PlatformOrganization, "id">) => navigate(`/superadmin/organizations/${o.id}`);

  const totalCameras = organizations.reduce((sum, o) => sum + (o.camera_sources_count ?? 0), 0);
  const onlineCameras = organizations.reduce((sum, o) => sum + (o.camera_sources_online_count ?? 0), 0);
  const openIncidents = organizations.reduce((sum, o) => sum + (o.open_incidents_count ?? 0), 0);

  return (
    <>
      <PageMeta title="Sites | Sentrix Console" description="Cross-tenant site directory" />
      <PageHeader
        title="Sites"
        breadcrumbs={[{ label: "Vision Guard" }, { label: "Sites" }]}
      />

      <div className="mb-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard label="Total Sites" tone="info" icon={<GroupIcon className="size-6" />} value={meta?.total ?? organizations.length} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard label="Total Cameras" tone="light" icon={<VideoIcon className="size-6" />} value={totalCameras} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard label="Cameras Online" tone="success" icon={<CheckCircleIcon className="size-6" />} value={onlineCameras} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard label="Open Incidents" tone="error" icon={<AlertHexaIcon className="size-6" />} value={openIncidents} />
        </div>
      </div>

      <FilterBar
        trailing={
          (q || region) && (
            <button
              onClick={() => {
                setQ("");
                setRegion("");
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
          label="Name"
          value={q}
          placeholder="Search by name"
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
        />
        <FilterText
          label="Region"
          value={region}
          placeholder="e.g. Lagos"
          onChange={(v) => {
            setRegion(v);
            setPage(1);
          }}
        />
      </FilterBar>

      <div className="mb-6">
        {mapped.length > 0 ? (
          <MapView center={mapCenter} zoom={7} markers={markers} onMarkerClick={(id) => navigate(`/superadmin/organizations/${id}`)} />
        ) : (
          <div className="flex h-[300px] items-center justify-center rounded-2xl border border-gray-200 bg-white text-theme-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.03]">
            No organizations with a resolved location yet.
          </div>
        )}
      </div>

      <OrganizationsTable
        organizations={organizations}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onRowClick={goToDetail}
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
  );
}
