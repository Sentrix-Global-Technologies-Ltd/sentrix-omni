import type { ReactNode } from "react";
import { Link } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import { AlertHexaIcon, ChatIcon, DollarLineIcon, GroupIcon, LockIcon, MapPinIcon, PieChartIcon } from "../../../icons";
import { useLeads } from "../../crm/hooks/useLeads";
import { useLedgerStats } from "../../ledger/hooks/useLedger";
import { useRidesOverview } from "../../ridesops/hooks/useRidesOps";
import { useCommandOverview } from "../../command/hooks/useCommand";
import Can from "../../../components/shared/Can";
import ProvisionBridgeButton from "../components/ProvisionBridgeButton";
import CreateOrganizationButton from "../../settings/components/CreateOrganizationButton";
import { useAuthz } from "../../../hooks/useAuthz";

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
  const { canAny, isSuperAdmin } = useAuthz();

  // Each hook is only enabled when the viewer actually holds a permission for
  // that section — this page is reachable by any platform-staff role now
  // (not just SuperAdmin), and firing a query the viewer has no permission
  // for would just 403 for no reason (the tile is hidden below regardless).
  const canLeads = canAny(["crm.leads.manage", "crm.leads.convert"]);
  const canLedger = canAny(["ledger.view", "ledger.manage"]);
  const canRides = canAny(["ridesops.view", "ridesops.dispatch"]);
  const canCommand = canAny([
    "cad.view",
    "cad.act",
    "command.view",
    "command.act",
    "coordination.view",
    "coordination.act",
  ]);

  const leads = useLeads({ per_page: 1 }, canLeads);
  const ledger = useLedgerStats(canLedger);
  const rides = useRidesOverview(canRides);
  const command = useCommandOverview(canCommand);

  const leadsTotal = leads.data?.meta?.total;

  // Each tile is only offered if the viewer actually holds a permission for
  // that section — this page is now reachable by any platform-staff role
  // (not just SuperAdmin), and each role only ever holds a subset of these
  // (see PlatformRole::permissions()), so unlike before we can no longer
  // assume "reached this page" implies "can see everything on it."
  const tiles: Tile[] = [
    ...(canLeads
      ? [
          {
            title: "CRM — Leads",
            description: "Sales pipeline: prospects from new through won/lost, with quotes and conversion.",
            to: "/superadmin/leads",
            icon: <GroupIcon className="size-6" />,
            statLabel: "Total leads",
            value: typeof leadsTotal === "number" ? leadsTotal : 0,
            loading: leads.isLoading,
          },
        ]
      : []),
    ...(canLedger
      ? [
          {
            title: "Ledger",
            description: "Financial sources, write activity, and reconciliation stats.",
            to: "/superadmin/ledger",
            icon: <DollarLineIcon className="size-6" />,
            statLabel: "Active sources",
            value: ledger.data?.data?.active_sources ?? 0,
            loading: ledger.isLoading,
          },
        ]
      : []),
    ...(canRides
      ? [
          {
            title: "Rides-Ops",
            description: "Ride marketplace operations: live rides, drivers, onboarding, surge.",
            to: "/superadmin/rides-ops",
            icon: <MapPinIcon className="size-6" />,
            statLabel: "Active rides",
            value: rides.data?.data?.rides?.active ?? 0,
            loading: rides.isLoading,
          },
        ]
      : []),
    ...(canCommand
      ? [
          {
            title: "Command & CAD",
            description: "Agency command hierarchy, dispatch routing, and command incidents.",
            to: "/superadmin/command",
            icon: <AlertHexaIcon className="size-6" />,
            statLabel: "Open command incidents",
            value: command.data?.data?.open ?? 0,
            loading: command.isLoading,
          },
        ]
      : []),
    ...(canAny(["security.posture.view"])
      ? [
          {
            title: "Security Posture",
            description: "Live auth, CORS, rate-limit, and response-header configuration for the API.",
            to: "/superadmin/security",
            icon: <LockIcon className="size-6" />,
            statLabel: "Report",
            value: "Live",
            loading: false,
          },
        ]
      : []),
    ...(canAny(["support.tickets.view"])
      ? [
          {
            title: "Support Queue",
            description: "Cross-tenant support ticket triage — status, resolution, and assignment.",
            to: "/superadmin/support",
            icon: <ChatIcon className="size-6" />,
            statLabel: "Queue",
            value: "Open",
            loading: false,
          },
        ]
      : []),
    // SuperAdmin-only, deliberately not delegable to any PlatformRole (see
    // PlatformSubscriptionController + superAdminSubPathAccess).
    ...(isSuperAdmin
      ? [
          {
            title: "Subscriptions",
            description: "Every organization's plan and billing status — free, trialing, active, cancelled.",
            to: "/superadmin/subscriptions",
            icon: <PieChartIcon className="size-6" />,
            statLabel: "Report",
            value: "Live",
            loading: false,
          },
        ]
      : []),
  ];

  return (
    <>
      <PageMeta title="SuperAdmin | Sentrix Console" description="Platform administration" />
      <PageHeader
        title="SuperAdmin"
        breadcrumbs={[{ label: "SuperAdmin" }]}
      />

      <div className="mb-4 flex flex-wrap justify-end gap-3">
        {/* Direct tenant provisioning (organizations.provision) — bypasses
            the CRM lead pipeline entirely, for OnboardingManager/SuperAdmin. */}
        <Can permission="organizations.provision">
          <CreateOrganizationButton />
        </Can>
        <Can anyPermission={["hardware.provision"]}>
          <ProvisionBridgeButton />
        </Can>
      </div>

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
