import AccentStatCard from "../../../components/shared/AccentStatCard";
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
    <div
      role="region"
      aria-label="Billing summary"
      className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <AccentStatCard
        label={noun}
        value={counts?.total ?? 0}
        accent="neutral"
        sub={segment === "organizations" ? "Customer organizations" : "With a billing record"}
        loading={isLoading}
      />
      <AccentStatCard label="Paying" value={counts?.paying ?? 0} accent="success" sub="On a paid plan" loading={isLoading} />
      <AccentStatCard label="Trialing" value={counts?.by_status.trialing ?? 0} accent="info" sub="In free trial" loading={isLoading} />
      <AccentStatCard label="Expired" value={counts?.by_status.expired ?? 0} accent="warning" sub="Needs renewal" loading={isLoading} />
      <AccentStatCard label="Cancelled" value={counts?.by_status.cancelled ?? 0} accent="critical" sub="Will not renew" loading={isLoading} />
      <AccentStatCard
        label="Revenue, last 30 days"
        value={revenueLabel(revenue, (r) => r.paid_last_30_days_cents)}
        accent="success"
        sub="Paid payments"
        loading={isLoading}
      />
      <AccentStatCard label="Failed payments" value={payments?.failed ?? 0} accent="critical" sub="Declined or errored" loading={isLoading} />
      <AccentStatCard label="Abandoned checkouts" value={payments?.abandoned ?? 0} accent="warning" sub="Unpaid after 24 hours" loading={isLoading} />
    </div>
  );
}
