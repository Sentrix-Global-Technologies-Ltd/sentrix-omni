import type { Tone } from "../../../components/ui/tone";
import type { PlatformBillingPayment, PlatformBillingStatus } from "../../billing/api/billing.types";

export const BILLING_STATUS_OPTIONS: { value: PlatformBillingStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

/** Tone for the DERIVED subscription status shown in the billing console. */
export function billingStatusTone(status: string): Tone {
  switch (status) {
    case "active":
      return "success";
    case "trialing":
      return "info";
    case "expired":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "light";
  }
}

/** Label + tone for a payment row; an uncompleted pending checkout reads "Abandoned". */
export function paymentBadge(p: Pick<PlatformBillingPayment, "status" | "abandoned">): { label: string; tone: Tone } {
  if (p.status === "paid") return { label: "Paid", tone: "success" };
  if (p.status === "failed") return { label: "Failed", tone: "error" };
  return p.abandoned ? { label: "Abandoned", tone: "warning" } : { label: "Pending", tone: "light" };
}
