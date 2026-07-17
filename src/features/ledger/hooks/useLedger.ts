import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ledgerApi } from "../api/ledger.api";
import { ledgerKeys } from "../api/ledger.keys";
import type { SourceFilters, WriteFilters } from "../api/ledger.types";

export function useLedgerStats(enabled = true) {
  return useQuery({
    queryKey: ledgerKeys.stats(),
    queryFn: () => ledgerApi.stats(),
    enabled,
  });
}

export function useLedgerSources(filters: SourceFilters) {
  return useQuery({
    queryKey: ledgerKeys.sources(filters),
    queryFn: () => ledgerApi.sources(filters),
    placeholderData: keepPreviousData,
  });
}

export function useLedgerWrites(filters: WriteFilters) {
  return useQuery({
    queryKey: ledgerKeys.writes(filters),
    queryFn: () => ledgerApi.writes(filters),
    placeholderData: keepPreviousData,
  });
}
