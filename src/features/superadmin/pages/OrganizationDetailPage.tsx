import { useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import LoadingState from "../../../components/ui/state/LoadingState";
import ErrorState from "../../../components/ui/state/ErrorState";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { formatDateTime } from "../../../lib/format";
import { usePlatformOrganization } from "../hooks/usePlatformOrganizations";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

function subscriptionTone(status: string | null): "success" | "warning" | "error" | "light" {
  if (status === "active") return "success";
  if (status === "trialing") return "warning";
  if (status === "cancelled" || status === "canceled") return "error";
  return "light";
}

/**
 * Sentrix Console (platform-staff) — a single organization's cross-tenant
 * detail view: basic info, owner, subscription status, member/hardware/CCTV
 * counts, and its Command oversight link (if its region matches an onboarded
 * agency command). Read-only, gated on organizations.view.
 */
export default function OrganizationDetailPage() {
  const { id = "" } = useParams();
  const query = usePlatformOrganization(id);
  const organization = query.data?.data;

  const breadcrumbs = [
    { label: "SuperAdmin", to: "/superadmin" },
    { label: "Organizations", to: "/superadmin/organizations" },
    { label: organization?.name ?? "Detail" },
  ];

  if (query.isLoading) {
    return (
      <>
        <PageHeader title="Organization" breadcrumbs={breadcrumbs} />
        <LoadingState />
      </>
    );
  }

  if (query.error || !organization) {
    return (
      <>
        <PageHeader title="Organization" breadcrumbs={breadcrumbs} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    );
  }

  return (
    <>
      <PageMeta title={`${organization.name} | Sentrix Console`} description="Organization detail" />
      <PageHeader
        title={organization.name}
        breadcrumbs={breadcrumbs}
        actions={
          <StatusBadge tone={subscriptionTone(organization.subscription_status)}>
            {organization.subscription_plan_key ?? "no subscription record"}
          </StatusBadge>
        }
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-6">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Organization</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Slug</dt>
                <dd className="text-gray-700 dark:text-gray-300">{organization.slug}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Region</dt>
                <dd className="text-gray-700 dark:text-gray-300">{organization.region ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Command oversight</dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {organization.command ? `${organization.command.name} (${organization.command.area ?? "—"})` : "Unmapped"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Created</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDateTime(organization.created_at)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Owner</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Name</dt>
                <dd className="text-gray-700 dark:text-gray-300">{organization.owner?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Email</dt>
                <dd className="text-gray-700 dark:text-gray-300">{organization.owner?.email ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Footprint</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Users</dt>
                <dd className="tabular-nums text-gray-700 dark:text-gray-300">{organization.members_count ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Hardware devices</dt>
                <dd className="tabular-nums text-gray-700 dark:text-gray-300">{organization.devices_count ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">CCTV / camera feeds</dt>
                <dd className="tabular-nums text-gray-700 dark:text-gray-300">
                  {organization.camera_sources_online_count ?? 0} online / {organization.camera_sources_count ?? 0} total
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Live status</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Open incidents</dt>
                <dd className="tabular-nums text-gray-700 dark:text-gray-300">{organization.open_incidents_count ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Active emergencies</dt>
                <dd className="tabular-nums text-gray-700 dark:text-gray-300">{organization.active_emergencies_count ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-400">Subscription status</dt>
                <dd className="text-gray-700 dark:text-gray-300">{organization.subscription_status ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}
