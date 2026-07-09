import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  LedgerSource,
  LedgerStats,
  LedgerWrite,
  SourceFilters,
  WriteFilters,
} from "./ledger.types";

/** Sentrix Ledger endpoints (platform/SuperAdmin). */
export const ledgerApi = {
  stats(): Promise<ApiResult<LedgerStats>> {
    return apiClient.get<LedgerStats>("ledger/stats");
  },

  sources(filters: SourceFilters): Promise<ApiResult<LedgerSource[]>> {
    return apiClient.get<LedgerSource[]>("ledger/sources", {
      query: { status: filters.status || undefined, page: filters.page },
    });
  },

  writes(filters: WriteFilters): Promise<ApiResult<LedgerWrite[]>> {
    return apiClient.get<LedgerWrite[]>("ledger/writes", {
      query: { type: filters.type || undefined, page: filters.page },
    });
  },

  // --- Source lifecycle (SuperAdmin; server-confirmed) ---
  activate(id: string): Promise<ApiResult<LedgerSource>> {
    return apiClient.post<LedgerSource>(`ledger/sources/${id}/activate`);
  },
  suspend(id: string): Promise<ApiResult<LedgerSource>> {
    return apiClient.post<LedgerSource>(`ledger/sources/${id}/suspend`);
  },
  revoke(id: string): Promise<ApiResult<LedgerSource>> {
    return apiClient.post<LedgerSource>(`ledger/sources/${id}/revoke`);
  },

  // Onboard / rotate return a one-time ingest key (shown once).
  onboard(payload: {
    name: string;
    kind: string;
    product?: string;
  }): Promise<ApiResult<{ source: LedgerSource; ingest_key: string }>> {
    return apiClient.post<{ source: LedgerSource; ingest_key: string }>("ledger/sources", payload);
  },
  rotateKey(id: string): Promise<ApiResult<{ source: LedgerSource; ingest_key: string }>> {
    return apiClient.post<{ source: LedgerSource; ingest_key: string }>(
      `ledger/sources/${id}/rotate-key`,
    );
  },
};
