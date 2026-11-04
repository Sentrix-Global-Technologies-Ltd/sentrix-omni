import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import Button from "../../../components/ui/button/Button";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { useOrganization } from "../../../context/OrganizationContext";
import { billingKeys } from "../api/billing.keys";
import { useCheckoutStatus } from "../hooks/useBilling";

const card =
  "mb-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]";

const PAID = ["paid", "succeeded", "completed"];
const FAILED = ["failed", "cancelled", "canceled"];

/**
 * Shown when the PSP (Paystack) sends the user back to the billing page with
 * `?reference=` (or `?trxref=`). Polls the payment until the webhook confirms
 * it, then refreshes the subscription and invoices. Renders nothing otherwise.
 */
export default function CheckoutReturnBanner() {
  const [params, setParams] = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  const statusQuery = useCheckoutStatus(reference, { poll: true });
  const payment = statusQuery.data?.data;
  const status = payment?.status;
  const paid = status ? PAID.includes(status) : false;
  const failed = status ? FAILED.includes(status) : false;

  useEffect(() => {
    if (paid && activeId) queryClient.invalidateQueries({ queryKey: billingKeys.all(activeId) });
  }, [paid, activeId, queryClient]);

  if (!reference) return null;

  const dismiss = () => {
    const next = new URLSearchParams(params);
    next.delete("reference");
    next.delete("trxref");
    setParams(next, { replace: true });
  };

  let message = "Confirming your payment…";
  if (paid) message = "Payment received — your plan is now active.";
  else if (failed) message = "Payment was not completed. You have not been charged for a plan change.";
  else if (statusQuery.isError) message = "We couldn't confirm this payment yet. Try checking again.";

  return (
    <div className={card} role="status">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{message}</p>
          <p className="mt-0.5 font-mono text-theme-xs text-gray-500 dark:text-gray-400">{reference}</p>
        </div>
        <div className="flex items-center gap-2">
          {status && <StatusBadge tone={paid ? "success" : failed ? "error" : "warning"}>{status}</StatusBadge>}
          {!paid && !failed && (
            <Button size="sm" variant="outline" disabled={statusQuery.isFetching} onClick={() => void statusQuery.refetch()}>
              {statusQuery.isFetching ? "Checking…" : "Check status"}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={dismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
