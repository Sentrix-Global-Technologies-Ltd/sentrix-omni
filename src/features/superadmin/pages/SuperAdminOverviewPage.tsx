import type { ReactNode } from "react";
import { Link } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import { AlertHexaIcon, DollarLineIcon, GroupIcon, MapPinIcon } from "../../../icons";
import { useLeads } from "../../crm/hooks/useLeads";
import { useLedgerStats } from "../../ledger/hooks/useLedger";
import { useRidesOverview } from "../../ridesops/hooks/useRidesOps";
import { useCommandOverview } from "../../command/hooks/useCommand";

interface Tile {
  title: string;
  description: string;
  to: string;
  icon: ReactNode;
  statLabel: string;
  value: ReactNode;
  loading: boolean;
}

/**
 * Platform-staff (SuperAdmin) overview — a live composite of the four platform
 * consoles' own existing "overview"/list endpoints (Command Center's
 * client-side-composition pattern, reused here: no new backend endpoint, each
 * hook is the same one its own console already uses). Distinct from the
 * Operations Command Center (org-scoped, dispatcher/supervisor) and Platform
 * Snapshot (network-wide incident/emergency/responder vitals) — this is
 * "how's the platform business itself doing."
 */
export default function SuperAdminOverviewPage() {
  const leads = useLeads({ per_page: 1 });
  const ledger = useLedgerStats();
  const rides = useRidesOverview();
  const command = useCommandOverview();

  const leadsTotal = leads.data?.meta?.total;

  const tiles: Tile[] = [
    {
      title: "CRM — Leads",
      description: "Sales pipeline: prospects from new through won/lost, with quotes and conversion.",
      to: "/superadmin/leads",
      icon: <GroupIcon className="size-6" />,
      statLabel: "Total leads",
      value: typeof leadsTotal === "number" ? leadsTotal : 0,
      loading: leads.isLoading,
    },
    {
      title: "Ledger",
      description: "Financial sources, write activity, and reconciliation stats.",
      to: "/superadmin/ledger",
      icon: <DollarLineIcon className="size-6" />,
      statLabel: "Active sources",
      value: ledger.data?.data?.active_sources ?? 0,
      loading: ledger.isLoading,
    },
    {
      title: "Rides-Ops",
      description: "Ride marketplace operations: live rides, drivers, onboarding, surge.",
      to: "/superadmin/rides-ops",
      icon: <MapPinIcon className="size-6" />,
      statLabel: "Active rides",
      value: rides.data?.data?.rides?.active ?? 0,
      loading: rides.isLoading,
    },
    {
      title: "Command & CAD",
      description: "Agency command hierarchy, dispatch routing, and command incidents.",
      to: "/superadmin/command",
      icon: <AlertHexaIcon className="size-6" />,
      statLabel: "Open command incidents",
      value: command.data?.data?.open ?? 0,
      loading: command.isLoading,
    },
  ];

  return (
    <>
      <PageMeta title="SuperAdmin | Sentrix Console" description="Platform administration" />
      <PageHeader
        title="SuperAdmin"
        breadcrumbs={[{ label: "SuperAdmin" }]}
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {tiles.map((tile) => (
          <div key={tile.title} className="col-span-12 sm:col-span-6 xl:col-span-3">
            <Link to={tile.to} className="block h-full">
              <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  {tile.icon}
                </span>

                <div className="mt-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{tile.statLabel}</span>
                  <h4 className="mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
                    {tile.loading ? "—" : tile.value}
                  </h4>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-gray-800 dark:text-white/90">{tile.title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tile.description}</p>
                <span className="mt-4 text-theme-sm font-medium text-brand-500">Open →</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
