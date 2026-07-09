import type { ReactNode } from "react";
import {
  AlertHexaIcon,
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
  TaskIcon,
  TrashBinIcon,
  UserCircleIcon,
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
        key: "evidence",
        label: "Evidence",
        path: "/evidence",
        icon: <FileIcon />,
        access: { anyPermission: ["evidence.view"] },
      },
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
        key: "billing",
        label: "Billing",
        path: "/billing",
        icon: <DollarLineIcon />,
        // Account-level self-service; available to any authenticated user.
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
        access: { superAdminOnly: true },
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

