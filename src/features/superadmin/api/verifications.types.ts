/** Platform KYC review types — mirror the backend PlatformIdentityVerificationResource. */

export type KycVerificationStatus = "unverified" | "pending" | "approved" | "rejected" | "error";

export interface KycVerification {
  id: string;
  user?: { id: string; name: string; email: string };
  provider: string;
  job_id: string | null;
  status: KycVerificationStatus;
  provider_status: string | null;
  country: string;
  id_type: string;
  id_number_last4: string | null;
  /** Only ever true for 'manual'-driver rows — see selfie(). */
  has_selfie: boolean;
  /** The staff member who approved/rejected — only ever set on a manually-decided row. */
  decided_by: { id: string; name: string } | null;
  reason: string | null;
  message: string | null;
  raw_response: Record<string, unknown> | null;
  submitted_at: string | null;
  completed_at: string | null;
  created_at: string | null;
}

export interface VerificationsQueueFilters {
  status?: string;
  country?: string;
  page?: number;
}

/** Approve/reject a 'manual'-driver submission — see verifications.manage. */
export interface DecideVerificationPayload {
  decision: "approved" | "rejected";
  note?: string;
}
