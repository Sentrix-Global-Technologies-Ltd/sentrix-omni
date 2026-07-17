import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { commandApi } from "../api/command.api";
import { commandKeys } from "../api/command.keys";
import type {
  AgencyFilters,
  CmdIncidentFilters,
  CommandNodeFilters,
  OrganizationOversightFilters,
  UnitFilters,
} from "../api/command.types";

export function useCommandOverview(enabled = true) {
  return useQuery({
    queryKey: commandKeys.overview(),
    queryFn: () => commandApi.overview(),
    enabled,
  });
}

export function useCommandIncidents(filters: CmdIncidentFilters) {
  return useQuery({
    queryKey: commandKeys.incidents(filters),
    queryFn: () => commandApi.incidents(filters),
    placeholderData: keepPreviousData,
  });
}

export function useAgencies(filters: AgencyFilters) {
  return useQuery({
    queryKey: commandKeys.agencies(filters),
    queryFn: () => commandApi.agencies(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCommandNodes(filters: CommandNodeFilters) {
  return useQuery({
    queryKey: commandKeys.commands(filters),
    queryFn: () => commandApi.commands(filters),
    placeholderData: keepPreviousData,
  });
}

export function useUnits(filters: UnitFilters = {}, enabled = true) {
  return useQuery({
    queryKey: commandKeys.units(filters),
    queryFn: () => commandApi.units(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Nearby units for a command incident — the primary source for the dispatch picker. */
export function useClosestUnits(incidentId: string, limit?: number, enabled = true) {
  return useQuery({
    queryKey: commandKeys.closestUnits(incidentId, limit),
    queryFn: () => commandApi.closestUnits(incidentId, limit),
    enabled: enabled && Boolean(incidentId),
  });
}

/** Read-only agency oversight — organizations under an agency/command's jurisdiction. */
export function useOrganizationsOversight(filters: OrganizationOversightFilters) {
  return useQuery({
    queryKey: commandKeys.organizations(filters),
    queryFn: () => commandApi.organizations(filters),
    placeholderData: keepPreviousData,
  });
}
