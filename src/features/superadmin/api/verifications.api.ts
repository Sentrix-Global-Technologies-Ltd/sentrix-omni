import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { DecideVerificationPayload, KycVerification, VerificationsQueueFilters } from "./verifications.types";

/** Sentrix Console (platform-staff) — cross-user KYC visibility, plus the
 * in-house manual-review decision. index/show are gated on verifications.view
 * (PlatformPermission); decide() is gated on the stricter verifications.manage
 * — both held by the ComplianceReviewer PlatformRole. decide() only ever
 * applies to 'manual'-driver rows — korapay/smile_id rows are decided by
 * their own automated path, never by a staff member here. */
export const verificationsQueueApi = {
  list(filters: VerificationsQueueFilters): Promise<ApiResult<KycVerification[]>> {
    return apiClient.get<KycVerification[]>("platform/verifications", {
      query: {
        status: filters.status || undefined,
        country: filters.country || undefined,
        page: filters.page,
      },
    });
  },

  show(id: string): Promise<ApiResult<KycVerification>> {
    return apiClient.get<KycVerification>(`platform/verifications/${id}`);
  },

  decide(id: string, payload: DecideVerificationPayload): Promise<ApiResult<KycVerification>> {
    return apiClient.patch<KycVerification>(`platform/verifications/${id}/decide`, payload);
  },

  /** "Reveal on click" — decrypts and returns the full ID number. Gated on
   * verifications.manage (stricter than the last4 already in the queue/modal)
   * and logged server-side every time it's called; only fetch this on an
   * explicit staff action, never automatically alongside show(). */
  revealIdNumber(id: string): Promise<ApiResult<{ id_number: string }>> {
    return apiClient.get<{ id_number: string }>(`platform/verifications/${id}/id-number`);
  },
};
