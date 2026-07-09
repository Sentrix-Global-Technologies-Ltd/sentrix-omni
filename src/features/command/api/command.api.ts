import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  Agency,
  AgencyFilters,
  ClosestUnit,
  CmdIncident,
  CmdIncidentFilters,
  CommandNode,
  CommandNodeFilters,
  CommandOverview,
  OrganizationOversight,
  OrganizationOversightFilters,
  Unit,
  UnitDispatch,
  UnitFilters,
} from "./command.types";

/** Command & CAD endpoints (platform/SuperAdmin) — /command/*. */
export const commandApi = {
  overview(): Promise<ApiResult<CommandOverview>> {
    return apiClient.get<CommandOverview>("command/overview");
  },

  incidents(filters: CmdIncidentFilters): Promise<ApiResult<CmdIncident[]>> {
    return apiClient.get<CmdIncident[]>("command/incidents", {
      query: {
        status: filters.status || undefined,
        severity: filters.severity || undefined,
        category: filters.category || undefined,
        page: filters.page,
      },
    });
  },

  agencies(filters: AgencyFilters): Promise<ApiResult<Agency[]>> {
    return apiClient.get<Agency[]>("command/agencies", {
      query: { status: filters.status || undefined, page: filters.page },
    });
  },

  commands(filters: CommandNodeFilters): Promise<ApiResult<CommandNode[]>> {
    return apiClient.get<CommandNode[]>("command/commands", {
      query: { tier: filters.tier || undefined, page: filters.page },
    });
  },

  units(filters: UnitFilters = {}): Promise<ApiResult<Unit[]>> {
    return apiClient.get<Unit[]>("command/units", {
      query: {
        command_id: filters.command_id || undefined,
        agency_id: filters.agency_id || undefined,
        status: filters.status || undefined,
        page: filters.page,
      },
    });
  },

  closestUnits(incidentId: string, limit?: number): Promise<ApiResult<ClosestUnit[]>> {
    return apiClient.get<ClosestUnit[]>(`command/incidents/${incidentId}/closest-units`, {
      query: { limit },
    });
  },

  /** Read-only agency oversight — organizations under an agency/command's jurisdiction. */
  organizations(filters: OrganizationOversightFilters): Promise<ApiResult<OrganizationOversight[]>> {
    return apiClient.get<OrganizationOversight[]>("command/organizations", {
      query: {
        agency_id: filters.agency_id || undefined,
        command_id: filters.command_id || undefined,
        page: filters.page,
      },
    });
  },

  // --- Write actions (SuperAdmin; server-confirmed) ---
  actOnIncident(id: string, action: string): Promise<ApiResult<CmdIncident>> {
    return apiClient.post<CmdIncident>(`command/incidents/${id}/act`, { action });
  },
  dispatchUnit(incidentId: string, payload: { unit_id: string }): Promise<ApiResult<UnitDispatch>> {
    return apiClient.post<UnitDispatch>(`command/incidents/${incidentId}/dispatch`, payload);
  },
  routeIncident(payload: {
    severity: string;
    summary: string;
    category?: string;
    source_type?: string;
  }): Promise<ApiResult<CmdIncident>> {
    return apiClient.post<CmdIncident>("command/incidents/route", payload);
  },
  createAgency(payload: {
    code: string;
    name: string;
    country?: string;
    categories: string[];
    hotline?: string;
    status?: string;
  }): Promise<ApiResult<Agency>> {
    return apiClient.post<Agency>("command/agencies", payload);
  },
  createCommand(payload: {
    agency_id: string;
    tier: string;
    name: string;
    area?: string;
  }): Promise<ApiResult<CommandNode>> {
    return apiClient.post<CommandNode>("command/commands", payload);
  },
};
