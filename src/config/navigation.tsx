import type { ReactNode } from "react";
import {
  AlertHexaIcon,
  AlarmBellIcon,
  BoltIcon,
  BoxCubeIcon,
  BoxIconLine,
  CalenderIcon,
  ChatIcon,
  DocsIcon,
  DollarLineIcon,
  EnvelopeIcon,
  FileIcon,
  GridIcon,
  GroupIcon,
  LockIcon,
  MapPinIcon,
  PageIcon,
  PaperPlaneIcon,
  PieChartIcon,
  PlugInIcon,
  ShootingStarIcon,
  TableIcon,
  TaskIcon,
  TrashBinIcon,
  UserCircleIcon,
  VideoIcon,
} from "../icons";
import type { AccessRule } from "../authz/access";

/**
 * Single source of truth for the console navigation.
 *
 * Each item carries an optional `access` rule (real backend permission keys).
 * The sidebar renders only the items + groups the current identity is allowed to
 * see (see useAuthz / authz/access).
 */
export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: ReactNode;
  access?: AccessRule;
  /**
   * Requires genuine organization membership, checked independently of
   * `access`/SuperAdmin-allow-all — this is for personal/consumer-facing
   * items (e.g. Billing's individual subscription self-service) that a
   * platform-staff-only identity (SuperAdmin/CustomerSupport/SentrixEngineer
   * etc. with no organization membership) has no reason to see, even though
   * a normal `access` rule can never hide anything from SuperAdmin.
   */
  requireOrgMembership?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", path: "/", icon: <GridIcon /> },
      {
        key: "assistant",
        label: "Assistant",
        path: "/assistant",
        icon: <ChatIcon />,
        // AI assistant available to any authenticated user.
      },
      {
        key: "platform-snapshot",
        label: "Platform Snapshot",
        path: "/platform-snapshot",
        icon: <ShootingStarIcon />,
        access: { superAdminOnly: true },
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        key: "incidents",
        label: "Incidents",
        path: "/incidents",
        icon: <AlertHexaIcon />,
        access: { anyPermission: ["incidents.view"] },
      },
      {
        key: "emergencies",
        label: "Emergencies",
        path: "/emergencies",
        icon: <BoltIcon />,
        access: { anyPermission: ["emergencies.view"] },
      },
      {
        key: "responders",
        label: "Responders",
        path: "/responders",
        icon: <GroupIcon />,
        access: { anyPermission: ["responders.view"] },
      },
      {
        key: "roster",
        label: "Roster",
        path: "/roster",
        icon: <CalenderIcon />,
        access: { anyPermission: ["responders.view"] },
      },
      {
        key: "assignments",
        label: "Assignments",
        path: "/assignments",
        icon: <TaskIcon />,
        access: { anyPermission: ["assignments.view"] },
      },
      {
        key: "tracking",
        label: "Live Tracking",
        path: "/tracking",
        icon: <MapPinIcon />,
        access: { anyPermission: ["tracking.view"] },
      },
      {
        key: "trips",
        label: "Trips",
        path: "/trips",
        icon: <PaperPlaneIcon />,
        access: { anyPermission: ["trips.view"] },
      },
    ],
  },
  {
    title: "Monitoring",
    items: [
      {
        key: "intel",
        label: "Intel",
        path: "/intel",
        icon: <PieChartIcon />,
        access: { anyPermission: ["intel.view"] },
      },
      {
        key: "notifications",
        label: "Notifications",
        path: "/notifications",
        icon: <EnvelopeIcon />,
        // Any authenticated user has a notification feed.
      },
      {
        key: "audit",
        label: "Audit",
        path: "/audit",
        icon: <DocsIcon />,
        access: { anyPermission: ["audit.view"] },
      },
    ],
  },
  {
    title: "Facility",
    items: [
      {
        key: "hardware",
        label: "Hardware",
        path: "/hardware",
        icon: <BoxCubeIcon />,
        access: { anyPermission: ["hardware.view"] },
      },
      {
        key: "access",
        label: "Access Control",
        path: "/access",
        icon: <LockIcon />,
        access: { anyPermission: ["passes.view"] },
      },
      {
        key: "insurance",
        label: "Insurance",
        path: "/insurance",
        icon: <BoxIconLine />,
        access: { anyPermission: ["insurance.policies.view"] },
      },
      {
        key: "retention",
        label: "Retention",
        path: "/retention",
        icon: <TrashBinIcon />,
        access: { anyPermission: ["storage.view"] },
      },
    ],
  },
  {
    // A dedicated section for the org's camera/surveillance estate. Reuses
    // existing permission-gated data end to end — Live Monitoring and Camera
    // Sources are org-scoped (bridges.view/bridges.manage), Evidence Vault and
    // Sites link the SAME pages already reachable from Monitoring/SuperAdmin
    // (no duplicated backend, no new permission scheme). AI Analytics reuses
    // the Intel domain's intel.view permission (ThreatScoreService).
    title: "Vision Guard",
    items: [
      {
        key: "vision-guard-live",
        label: "Live Monitoring",
        path: "/vision-guard/live",
        icon: <VideoIcon />,
        access: { anyPermission: ["bridges.view"] },
      },
      {
        key: "vision-guard-camera-sources",
        label: "Camera Sources",
        path: "/vision-guard/camera-sources",
        icon: <TableIcon />,
        access: { anyPermission: ["bridges.view"] },
      },
      {
        key: "vision-guard-facility-map",
        label: "Facility Map",
        path: "/vision-guard/facility-map",
        icon: <MapPinIcon />,
        access: { anyPermission: ["hardware.view"] },
      },
      {
        key: "vision-guard-detections",
        label: "Detections",
        path: "/vision-guard/detections",
        icon: <AlarmBellIcon />,
        // Gated on incidents.view — the same permission the backend
        // OrganizationDetectionController::recent() requires.
        access: { anyPermission: ["incidents.view"] },
      },
      {
        key: "vision-guard-ai-analytics",
        label: "AI Analytics",
        path: "/vision-guard/ai-analytics",
        icon: <PieChartIcon />,
        access: { anyPermission: ["intel.view"] },
      },
      {
        key: "vision-guard-evidence",
        label: "Evidence Vault",
        path: "/evidence",
        icon: <FileIcon />,
        access: { anyPermission: ["evidence.view"] },
      },
      {
        key: "vision-guard-sites",
        label: "Sites",
        path: "/superadmin/organizations",
        icon: <GroupIcon />,
        access: { anyPermission: ["organizations.view"] },
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        key: "admin",
        label: "Admin Overview",
        path: "/admin",
        icon: <PageIcon />,
        access: { anyPermission: ["organization.update"] },
      },
      {
        key: "settings",
        label: "Settings",
        path: "/settings",
        icon: <UserCircleIcon />,
        // Every user can manage their own profile/settings.
      },
      {
        key: "support",
        label: "Support",
        path: "/support",
        icon: <ChatIcon />,
        // Supervisor-tier only (Supervisor + OrganizationAdmin) — see
        // OrganizationRole.php. Dispatcher/Responder/User escalate to their
        // own Supervisor instead of raising a ticket directly.
        access: { anyPermission: ["support.view"] },
      },
      {
        key: "billing",
        label: "Billing",
        path: "/billing",
        icon: <DollarLineIcon />,
        // The organization's own Sentrix subscription (billing.view/manage —
        // OrganizationAdmin only, see OrganizationRole.php). NOT a personal
        // per-user plan — there is no such concept in this system. Also not
        // shown to Sentrix's own platform staff (SuperAdmin/CustomerSupport/
        // SentrixEngineer/etc. with no org membership) — see
        // requireOrgMembership below.
        access: { anyPermission: ["billing.view"] },
        requireOrgMembership: true,
      },
      {
        key: "roles",
        label: "Roles & Permissions",
        path: "/roles",
        icon: <LockIcon />,
        access: { anyPermission: ["members.view"] },
      },
      {
        key: "webhooks",
        label: "Webhooks",
        path: "/webhooks",
        icon: <PlugInIcon />,
        access: { anyPermission: ["webhooks.manage"] },
      },
      {
        key: "superadmin",
        label: "SuperAdmin",
        path: "/superadmin",
        icon: <LockIcon />,
        // Visible to any platform-staff role, not just true SuperAdmin — each
        // PlatformRole (OnboardingManager, SentrixEngineer, CustomerSupport,
        // Sales, LedgerViewer/Admin, RidesOps/Dispatch, DispatchCoordinator/
        // Monitor/Auditor) only ever holds a subset of these, and the overview
        // page itself only renders the tiles/actions the viewer actually has
        // permission for (see SuperAdminOverviewPage + superAdminSubPathAccess
        // below for the per-section route guards).
        access: {
          anyPermission: [
            "crm.leads.manage",
            "crm.leads.convert",
            "organizations.provision",
            "ledger.view",
            "ledger.manage",
            "ridesops.view",
            "ridesops.dispatch",
            "cad.view",
            "cad.act",
            "command.view",
            "command.act",
            "coordination.view",
            "coordination.act",
            "security.posture.view",
            "hardware.provision",
            "support.tickets.view",
            "support.tickets.manage",
            "verifications.view",
            "vision-guard.consumer.view",
          ],
        },
      },
    ],
  },
];

/**
 * Access rule per route path — the SAME rules that drive nav visibility, reused
 * by the route guards (RequirePermission) for defense-in-depth. Single source of
 * truth: nav and routing can never drift.
 */
export const accessByPath: Record<string, AccessRule | undefined> =
  Object.fromEntries(
    navigation.flatMap((group) => group.items.map((i) => [i.path, i.access])),
  );

/**
 * Per-section access for the `/superadmin/*` sub-pages. These aren't their own
 * sidebar items (they're reached via the tiles on SuperAdminOverviewPage), so
 * they don't go through `navigation`/`accessByPath` above — but each still
 * needs its own route guard, exactly like every other console section, rather
 * than sharing one blanket `superAdminOnly` gate that only a true SuperAdmin
 * could ever pass. Keys match PlatformRole.permissions() (PlatformPermission.php).
 */
export const superAdminSubPathAccess: Record<string, AccessRule> = {
  "/superadmin/leads": { anyPermission: ["crm.leads.manage", "crm.leads.convert"] },
  "/superadmin/ledger": { anyPermission: ["ledger.view", "ledger.manage"] },
  "/superadmin/rides-ops": { anyPermission: ["ridesops.view", "ridesops.dispatch"] },
  "/superadmin/command": {
    anyPermission: [
      "cad.view",
      "cad.act",
      "command.view",
      "command.act",
      "coordination.view",
      "coordination.act",
    ],
  },
  "/superadmin/security": { anyPermission: ["security.posture.view"] },
  "/superadmin/support": { anyPermission: ["support.tickets.view", "support.tickets.manage"] },
  "/superadmin/verifications": { anyPermission: ["verifications.view"] },
  "/superadmin/consumer-vision": { anyPermission: ["vision-guard.consumer.view"] },
  "/superadmin/road-risk": { anyPermission: ["roadrisk.view", "roadrisk.manage"] },
  "/superadmin/community": { anyPermission: ["community.view", "community.manage"] },
  // Cross-tenant subscription oversight is SuperAdmin-only by explicit
  // product decision — unlike the sections above, it is NOT delegable to any
  // PlatformRole (mirrors PlatformSubscriptionController's isSuperAdmin() gate).
  "/superadmin/subscriptions": { superAdminOnly: true },
  // Cross-tenant organization directory — delegable beyond SuperAdmin
  // (OnboardingManager, SentrixEngineer both hold organizations.view; see
  // PlatformOrganizationController).
  "/superadmin/organizations": { anyPermission: ["organizations.view"] },
};

