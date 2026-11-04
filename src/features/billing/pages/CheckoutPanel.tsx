import { useState } from "react";
import Button from "../../../components/ui/button/Button";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useCheckoutActions, useCheckoutStatus } from "../hooks/useBilling";
import { isHostedCheckoutUrl } from "./hostedCheckout";
import { describeOption } from "./planOptionCopy";
import type { Plan, PlanOption } from "../api/billing.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

function paymentTone(s: string): "success" | "warning" | "error" | "light" {
  if (s === "paid" || s === "succeeded" || s === "completed") return "success";
  if (s === "pending" || s === "processing") return "warning";
  if (s === "failed" || s === "cancelled" || s === "canceled") return "error";
  return "light";
}

/**
 * PSP checkout flow (ADR-0001): start a checkout session for a plan, then
 * poll its status by reference. `simulate` stands in for the real PSP
 * redirect/webhook in dev/test environments (stub payment provider — no
 * money actually moves), so the pending checkout can be advanced to
 * completion without leaving the console.
 */
export default function CheckoutPanel({ plan, option }: { plan: Plan; option: PlanOption }) {
  const [reference, setReference] = useState<string | null>(null);
  const toast = useToast();
  const { checkout, simulate } = useCheckoutActions();
  const statusQuery = useCheckoutStatus(reference);
  const payment = statusQuery.data?.data;

  const handleCheckout = async () => {
    const result = await checkout.mutateAsync({ planKey: plan.key });
    // A real PSP (Paystack) returns an absolute hosted-checkout URL: send the
    // user there; the PSP returns them to the billing page with the reference.
    // The stub provider returns a relative sandbox path — stay on the pending
    // panel (simulate / check status) in that case.
    if (isHostedCheckoutUrl(result.data.checkout_url)) {
      window.location.assign(result.data.checkout_url);
      return;
    }
    setReference(result.data.reference);
  };

  const handleSimulate = async () => {
    if (!reference) return;
    try {
      await simulate.mutateAsync(reference);
      toast.success("Checkout completed (simulated)");
      setReference(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Simulate failed. Please try again.");
    }
  };

  if (reference) {
    return (
      <div className={`${card} mt-3 !p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Checkout pending</p>
            <p className="mt-0.5 font-mono text-theme-xs text-gray-500 dark:text-gray-400">{reference}</p>
          </div>
          {payment && <StatusBadge tone={paymentTone(payment.status)}>{payment.status}</StatusBadge>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={statusQuery.isFetching}
            onClick={() => void statusQuery.refetch()}
          >
            {statusQuery.isFetching ? "Checking…" : "Check status"}
          </Button>
          <Button size="sm" variant="outline" disabled={simulate.isPending} onClick={() => void handleSimulate()}>
            {simulate.isPending ? "Simulating…" : "Simulate completion"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setReference(null)}>
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ConfirmActionButton
      label={option.label}
      title={`${option.label}: ${plan.name}?`}
      description={describeOption(plan, option)}
      confirmLabel="Continue to payment"
      onConfirm={handleCheckout}
    />
  );
}
