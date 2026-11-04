import StatCard from "../../../components/shared/StatCard";
import { formatMoney } from "../../../lib/format";
import type {
  PlatformBillingRevenueRow,
  PlatformBillingSegment,
  PlatformBillingSummary,
} from "../../billing/api/billing.types";

interface Props {
  segment: PlatformBillingSegment;
  summary?: PlatformBillingSummary;
  isLoading?: boolean;
}

/** One value per currency, never summed across currencies. */
function revenueLabel(rows: PlatformBillingRevenueRow[] | undefined, pick: (r: PlatformBillingRevenueRow) => number) {
  if (!rows || rows.length === 0) return "—";
  return rows.map((r) => formatMoney(pick(r), r.currency)).join(" · ");
}

/** Headline numbers for the selected segment of the SuperAdmin billing console. */
export default function BillingSummaryCards({ segment, summary, isLoading }: Props) {
  const counts = summary?.[segment];
  const payments = summary?.payments[segment];
  const revenue = summary?.revenue[segment];
  const noun = segment === "organizations" ? "Organizations" : "Individuals";

  return (
    <div role="region" aria-label="Billing summary" className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard label={noun} value={counts?.total ?? 0} loading={isLoading} />
      <StatCard label="Paying" value={counts?.paying ?? 0} tone="success" loading={isLoading} />
      <StatCard label="Trialing" value={counts?.by_status.trialing ?? 0} tone="info" loading={isLoading} />
      <StatCard label="Expired" value={counts?.by_status.expired ?? 0} tone="warning" loading={isLoading} />
      <StatCard label="Cancelled" value={counts?.by_status.cancelled ?? 0} tone="error" loading={isLoading} />
      <StatCard
        label="Revenue, last 30 days"
        value={revenueLabel(revenue, (r) => r.paid_last_30_days_cents)}
        loading={isLoading}
      />
      <StatCard label="Failed payments" value={payments?.failed ?? 0} tone="error" loading={isLoading} />
      <StatCard label="Abandoned checkouts" value={payments?.abandoned ?? 0} tone="warning" loading={isLoading} />
    </div>
  );
}
