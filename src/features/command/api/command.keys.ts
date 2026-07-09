import type {
  AgencyFilters,
  CmdIncidentFilters,
  CommandNodeFilters,
  OrganizationOversightFilters,
  UnitFilters,
} from "./command.types";

/** Command & CAD is platform-scoped (SuperAdmin), not org-scoped. */
export const commandKeys = {
  all: () => ["command"] as const,
  overview: () => ["command", "overview"] as const,
  incidents: (filters: CmdIncidentFilters) => ["command", "incidents", filters] as const,
  agencies: (filters: AgencyFilters) => ["command", "agencies", filters] as const,
  commands: (filters: CommandNodeFilters) => ["command", "commands", filters] as const,
  units: (filters: UnitFilters) => ["command", "units", filters] as const,
  closestUnits: (incidentId: string, limit?: number) =>
    ["command", "incidents", incidentId, "closest-units", limit] as const,
  organizations: (filters: OrganizationOversightFilters) =>
    ["command", "organizations", filters] as const,
};
