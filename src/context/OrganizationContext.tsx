import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { apiClient } from "../services/api/client";
import { organizationsApi } from "../services/api/organizations";
import type { Organization } from "../services/api/types";

interface OrganizationContextValue {
  /** The active organization (from the principal). */
  current: Organization | null;
  /** All organizations the user belongs to. */
  organizations: Organization[];
  /** Active organization id (also sent as the X-Organization header). */
  activeId: string | null;
  /** True when the user belongs to more than one org (switcher is meaningful). */
  canSwitch: boolean;
  /** True while a switch is in flight. */
  switching: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(
  undefined,
);

/**
 * Centralizes organization context for the whole app.
 *
 * - Derives the current org + membership list from the API identity (principal).
 * - Owns the `X-Organization` header on the API client, so EVERY request can
 *   carry org context (the backend's tenant resolver honours it on org-scoped
 *   routes).
 * - Provides `switchOrganization`, ready for multi-organization users: it calls
 *   the backend switch endpoint and re-hydrates the principal.
 */
export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { principal, refresh } = useAuth();
  const [switching, setSwitching] = useState(false);

  const organizations = principal?.organizations ?? [];
  const current = principal?.current_organization ?? null;
  const activeId = principal?.current_organization_id ?? null;

  // Keep the API client's org header in sync with the active organization.
  useEffect(() => {
    apiClient.setActiveOrganizationId(activeId);
  }, [activeId]);

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      if (organizationId === activeId) return;
      setSwitching(true);
      try {
        // Send the new org context immediately, persist on the backend, then
        // re-hydrate identity (roles/permissions/org) for the new tenant.
        apiClient.setActiveOrganizationId(organizationId);
        await organizationsApi.switch(organizationId);
        await refresh();
      } catch {
        // Revert the header on failure; the principal still reflects the old org.
        apiClient.setActiveOrganizationId(activeId);
      } finally {
        setSwitching(false);
      }
    },
    [activeId, refresh],
  );

  return (
    <OrganizationContext.Provider
      value={{
        current,
        organizations,
        activeId,
        canSwitch: organizations.length > 1,
        switching,
        switchOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = (): OrganizationContextValue => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }
  return context;
};
