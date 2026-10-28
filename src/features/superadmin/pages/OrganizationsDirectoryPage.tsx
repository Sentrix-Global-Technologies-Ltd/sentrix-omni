import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import FilterBar from "../../../components/shared/FilterBar";
import FilterText from "../../../components/shared/FilterText";
import Pagination from "../../../components/ui/pagination/Pagination";
import DashboardKpiCard from "../../dashboard/components/DashboardKpiCard";
import WorldChoroplethMap from "../../../components/shared/WorldChoroplethMap";
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
          <DashboardKpiCard label="Total Sites" tone="info" icon={<GroupIcon className="size-6" />} value={meta?.total ?? organizations.length} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <DashboardKpiCard label="Total Cameras" tone="light" icon={<VideoIcon className="size-6" />} value={totalCameras} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <DashboardKpiCard label="Cameras Online" tone="success" icon={<CheckCircleIcon className="size-6" />} value={onlineCameras} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <DashboardKpiCard label="Open Incidents" tone="error" icon={<AlertHexaIcon className="size-6" />} value={openIncidents} />
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
        <WorldChoroplethMap
          orgs={mapped.map((o) => ({ id: o.id, lat: o.lat as number, lng: o.lng as number }))}
          onCountryClick={(iso) => navigate(`/superadmin/organizations?country=${iso}`)}
        />
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
