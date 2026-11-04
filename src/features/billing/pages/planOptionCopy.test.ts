/**
 * POC-1  Upgrade copy shows the list price, the credit, and the VAT-inclusive total.
 * POC-2  Renew copy says the period is added after the current one.
 * POC-3  A first purchase states what is paid and that payment happens at the provider.
 */
import { describe, it, expect } from "vitest";
import { describeOption } from "./planOptionCopy";
import type { Plan, PlanOption } from "../api/billing.types";

const plan = { key: "pro_annual", name: "Pro Annual", interval: "year" } as Plan;
const option = (over: Partial<PlanOption>): PlanOption =>
  ({
    key: "pro_annual",
    name: "Pro Annual",
    action: "subscribe",
    allowed: true,
    immediate: true,
    label: "x",
    reason: null,
    effective_at: null,
    price: { currency: "NGN", subtotal_cents: 475000000, credit_cents: 25000000, tax_cents: 35625000, amount_cents: 510625000 },
    ...over,
  }) as PlanOption;

describe("describeOption", () => {
  it("POC-1 upgrade shows credit and total", () => {
    const text = describeOption(plan, option({ action: "upgrade" }));
    expect(text).toMatch(/Starts today and replaces your current plan/);
    expect(text).toMatch(/credit for the unused time/);
    expect(text).toMatch(/includes .* VAT/);
  });

  it("POC-2 renew adds a period after the current one", () => {
    expect(describeOption(plan, option({ action: "renew" }))).toMatch(/after your current period/);
  });

  it("POC-3 subscribe mentions the payment provider", () => {
    expect(describeOption(plan, option({ action: "subscribe" }))).toMatch(/payment provider/);
  });
});
