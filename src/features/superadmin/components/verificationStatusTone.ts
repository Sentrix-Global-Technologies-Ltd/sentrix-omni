import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";

export function verificationStatusTone(status: string): Tone {
  switch (status) {
    case "unverified":
      return "light";
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "error";
    case "error":
      return "error";
    default:
      return "light";
  }
}

/** Mirrors the backend's KycStatus enum exactly. */
export const KYC_STATUS_OPTIONS: FilterOption[] = [
  { value: "unverified", label: "Unverified" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "error", label: "Error" },
];
