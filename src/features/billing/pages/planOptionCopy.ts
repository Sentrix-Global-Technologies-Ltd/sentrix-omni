import { formatMoney } from "../../../lib/format";
import type { Plan, PlanOption } from "../api/billing.types";

/** Exact, plain-language preview of what confirming will do and cost. */
export function describeOption(plan: Plan, option: PlanOption): string {
  const { price } = option;
  const total = formatMoney(price.amount_cents, price.currency);
  const vat = price.tax_cents > 0 ? ` (includes ${formatMoney(price.tax_cents, price.currency)} VAT)` : "";
  const next = "You'll be taken to our payment provider to pay.";

  switch (option.action) {
    case "upgrade":
      return price.credit_cents > 0
        ? `Starts today and replaces your current plan. ${plan.name} costs ${formatMoney(price.subtotal_cents + price.credit_cents, price.currency)}, less ${formatMoney(price.credit_cents, price.currency)} credit for the unused time on your current plan. You pay ${total}${vat}. ${next}`
        : `Starts today and replaces your current plan. You pay ${total}${vat}. ${next}`;
    case "renew":
      return `Adds a new ${plan.interval} to ${plan.name}, after your current period. You pay ${total}${vat}. ${next}`;
    default:
      return `Starts today. You pay ${total}${vat} for ${plan.name}, billed per ${plan.interval}. ${next}`;
  }
}
