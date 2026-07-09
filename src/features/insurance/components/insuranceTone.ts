import type { Tone } from "../../../components/ui/tone";

export { formatDateTime, titleCase, humanize } from "../../../lib/format";

export function money(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

export function policyStatusTone(status: string): Tone {
  switch (status) {
    case "active":
      return "success";
    case "expired":
    case "cancelled":
      return "light";
    case "lapsed":
      return "warning";
    default:
      return "light";
  }
}

export function claimStatusTone(status: string): Tone {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "error";
    case "filed":
    case "under_review":
    case "pending":
      return "warning";
    default:
      return "light";
  }
}
