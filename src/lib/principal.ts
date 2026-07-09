/**
 * Principal helpers for UX gating only — the backend authorizes every API call.
 * SuperAdmin is treated as allow-all to mirror the backend's Gate::before.
 */

import type { Principal } from "../services/api/types";

export const isSuperAdmin = (p: Principal): boolean =>
  p.roles.includes("SuperAdmin");

export const hasRole = (p: Principal, role: string): boolean =>
  p.roles.includes(role);

export const hasAnyRole = (p: Principal, roles: string[]): boolean =>
  roles.some((role) => p.roles.includes(role));

export const hasPermission = (p: Principal, permission: string): boolean =>
  isSuperAdmin(p) || p.permissions.includes(permission);

export const belongsToAnyOrganization = (p: Principal): boolean =>
  p.current_organization_id !== null || p.organizations.length > 0;

export const currentOrganizationName = (p: Principal): string | null =>
  p.current_organization?.name ?? null;

export const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";
