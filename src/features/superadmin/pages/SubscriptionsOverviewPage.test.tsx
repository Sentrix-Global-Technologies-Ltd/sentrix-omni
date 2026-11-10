/**
 * SuperAdmin Billing & Subscriptions console (read-only).
 *
 * SBC-1  Summary cards render for the active segment.
 * SBC-2  Organizations list renders with derived status; only that segment is fetched.
 * SBC-3  Switching to Individuals fetches that list and resets filters.
 * SBC-4  Status filter is sent to the API and resets to page 1.
 * SBC-5  Plan options come from the summary, not a hard-coded catalogue.
 * SBC-6  Clicking an organization opens the detail with payments (incl. "Abandoned") and invoices.
 * SBC-7  An individual's detail shows receipts and no invoices section.
 * SBC-8  A list error shows a retry state.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import SubscriptionsOverviewPage from "./SubscriptionsOverviewPage";
import type {
  PlatformBillingIndividual,
  PlatformBillingOrganization,
  PlatformBillingSummary,
} from "../../billing/api/billing.types";

vi.mock("../../../components/common/PageMeta", () => ({ default: () => null }));
// The override panel has its own tests (BillingOverridePanel.test.tsx).
vi.mock("../components/BillingOverridePanel", () => ({ default: () => <div data-testid="override-panel-stub" /> }));
vi.mock("../../../components/shared/Can", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const hooks = vi.hoisted(() => ({
  usePlatformBillingSummary: vi.fn(),
  usePlatformBillingOrganizations: vi.fn(),
  usePlatformBillingIndividuals: vi.fn(),
  usePlatformBillingOrganization: vi.fn(),
  usePlatformBillingIndividual: vi.fn(),
}));
vi.mock("../../billing/hooks/useBilling", () => hooks);

const customer = {
  stored_status: "active",
  has_subscription_record: true,
  auto_renew: true,
  trial_ends_at: null,
  current_period_end: "2026-12-01T00:00:00Z",
  last_payment_at: "2026-11-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
};

const org: PlatformBillingOrganization = {
  ...customer,
  organization_id: "org-1",
  name: "Acme Security",
  slug: "acme-security",
  region: "Lagos",
  lat: null,
  lng: null,
  owner: { name: "Ada Lovelace", email: "ada@acme.test", phone: "+2348000000001" },
  plan_key: "pro_monthly",
  plan_name: "Pro Monthly",
  status: "expired",
};

const person: PlatformBillingIndividual = {
  ...customer,
  user_id: "user-1",
  name: "Chidi Okeke",
  email: "chidi@example.test",
  phone: "+2348000000002",
  country: "NG",
  plan_key: "plus",
  plan_name: "Plus",
  status: "active",
};

const summary: PlatformBillingSummary = {
  generated_at: "2026-11-03T00:00:00Z",
  organizations: {
    total: 7,
    paying: 3,
    by_status: { active: 4, trialing: 1, expired: 2, cancelled: 0 },
    by_plan: { free: 4, pro_monthly: 3 },
  },
  individuals: {
    total: 12,
    paying: 5,
    by_status: { active: 9, trialing: 0, expired: 1, cancelled: 2 },
    by_plan: { free: 7, plus: 5 },
  },
  payments: {
    organizations: { paid: 3, failed: 1, pending: 0, abandoned: 2 },
    individuals: { paid: 5, failed: 0, pending: 1, abandoned: 0 },
  },
  revenue: {
    organizations: [{ currency: "USD", paid_total_cents: 15000, paid_last_30_days_cents: 5000, payments_count: 3 }],
    individuals: [{ currency: "NGN", paid_total_cents: 750000, paid_last_30_days_cents: 150000, payments_count: 5 }],
  },
};

const list = <T,>(rows: T[]) => ({
  data: { data: rows, meta: { current_page: 1, last_page: 3, total: 30, from: 1, to: 10 } },
  isLoading: false,
  error: null,
  refetch: vi.fn(),
});
const idle = { data: undefined, isLoading: false, isError: false, error: null, refetch: vi.fn() };

function renderPage() {
  return render(
    <MemoryRouter>
      <SubscriptionsOverviewPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  hooks.usePlatformBillingSummary.mockReturnValue({ data: { data: summary }, isLoading: false });
  hooks.usePlatformBillingOrganizations.mockReturnValue(list([org]));
  hooks.usePlatformBillingIndividuals.mockReturnValue(list([person]));
  hooks.usePlatformBillingOrganization.mockReturnValue(idle);
  hooks.usePlatformBillingIndividual.mockReturnValue(idle);
});

describe("SubscriptionsOverviewPage (SuperAdmin billing console)", () => {
  it("SBC-1 renders the summary cards for the active segment", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Billing & Subscriptions" })).toBeInTheDocument();
    const cards = within(screen.getByRole("region", { name: "Billing summary" }));
    expect(cards.getByText("Paying").closest(".ic-stat-card")).toHaveTextContent("3");
    expect(cards.getByText("Expired").closest(".ic-stat-card")).toHaveTextContent("2");
    expect(cards.getByText("Abandoned checkouts").closest(".ic-stat-card")).toHaveTextContent("2");
    expect(cards.getByText("Revenue, last 30 days").closest(".ic-stat-card")).toHaveTextContent("$50.00");
  });

  it("SBC-2 lists organizations with derived status and fetches only that segment", () => {
    renderPage();
    const row = within(screen.getByText("Acme Security").closest("tr") as HTMLElement);
    expect(row.getByText("Expired")).toBeInTheDocument();
    expect(row.getByText("Pro Monthly")).toBeInTheDocument();
    expect(hooks.usePlatformBillingOrganizations).toHaveBeenLastCalledWith(expect.any(Object), true);
    expect(hooks.usePlatformBillingIndividuals).toHaveBeenLastCalledWith(expect.any(Object), false);
  });

  it("SBC-3 switching to Individuals fetches that list and resets filters", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByLabelText("Status"), "trialing");
    await user.click(screen.getByRole("button", { name: "Individuals" }));

    expect(screen.getByText("Chidi Okeke")).toBeInTheDocument();
    expect(screen.queryByText("Acme Security")).not.toBeInTheDocument();
    expect(hooks.usePlatformBillingIndividuals).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "", page: 1 }),
      true,
    );
    expect(hooks.usePlatformBillingOrganizations).toHaveBeenLastCalledWith(expect.any(Object), false);
  });

  it("SBC-4 sends the status filter to the API and returns to page 1", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByLabelText("Status"), "expired");

    expect(hooks.usePlatformBillingOrganizations).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "expired", page: 1 }),
      true,
    );
  });

  it("SBC-5 builds plan options from the summary", () => {
    renderPage();
    const plan = screen.getByLabelText("Plan");
    expect(within(plan).getByRole("option", { name: "Pro Monthly" })).toBeInTheDocument();
    expect(within(plan).getByRole("option", { name: "Free" })).toBeInTheDocument();
    expect(within(plan).queryByRole("option", { name: "Plus" })).not.toBeInTheDocument();
  });

  it("SBC-6 opens organization detail with payments, abandoned checkout and invoices", async () => {
    hooks.usePlatformBillingOrganization.mockImplementation((id: string | null) =>
      id
        ? {
            data: {
              data: {
                ...org,
                payments: [
                  {
                    reference: "pay_paid1",
                    plan_key: "pro_monthly",
                    plan_name: "Pro Monthly",
                    amount_cents: 4999,
                    currency: "USD",
                    subtotal_cents: 4650,
                    tax_cents: 349,
                    status: "paid",
                    abandoned: false,
                    provider: "paystack",
                    region: "NG",
                    paid_at: "2026-11-01T00:00:00Z",
                    created_at: "2026-11-01T00:00:00Z",
                  },
                  {
                    reference: "pay_old1",
                    plan_key: "pro_monthly",
                    plan_name: "Pro Monthly",
                    amount_cents: 4999,
                    currency: "USD",
                    subtotal_cents: null,
                    tax_cents: null,
                    status: "pending",
                    abandoned: true,
                    provider: "paystack",
                    region: "NG",
                    paid_at: null,
                    created_at: "2026-10-01T00:00:00Z",
                  },
                ],
                invoices: [
                  {
                    id: "inv-1",
                    number: "INV-ACME-1",
                    plan_key: "pro_monthly",
                    amount_cents: 4999,
                    amount: "49.99",
                    currency: "USD",
                    status: "paid",
                    issued_at: "2026-11-01T00:00:00Z",
                  },
                ],
              },
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
          }
        : idle,
    );

    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("Acme Security"));

    expect(hooks.usePlatformBillingOrganization).toHaveBeenLastCalledWith("org-1");
    expect(await screen.findByText("Payment history")).toBeInTheDocument();
    expect(screen.getByText("pay_paid1")).toBeInTheDocument();
    expect(screen.getByText("Abandoned")).toBeInTheDocument();
    expect(screen.getByText("INV-ACME-1")).toBeInTheDocument();
    expect(screen.getByText("Owner email").nextElementSibling).toHaveTextContent("ada@acme.test");
  });

  it("SBC-7 shows an individual's receipts and no invoices section", async () => {
    hooks.usePlatformBillingIndividual.mockImplementation((id: string | null) =>
      id
        ? {
            data: {
              data: {
                ...person,
                receipts: [
                  {
                    reference: "sub_rcpt1",
                    plan_key: "plus",
                    plan_name: "Plus",
                    amount_cents: 150000,
                    currency: "NGN",
                    subtotal_cents: null,
                    tax_cents: null,
                    status: "paid",
                    abandoned: false,
                    provider: "paystack",
                    region: null,
                    paid_at: "2026-11-01T00:00:00Z",
                    created_at: "2026-11-01T00:00:00Z",
                  },
                ],
              },
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
          }
        : idle,
    );

    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Individuals" }));
    await user.click(screen.getByText("Chidi Okeke"));

    expect(await screen.findByText("Payments & receipts")).toBeInTheDocument();
    expect(screen.getByText("sub_rcpt1")).toBeInTheDocument();
    expect(screen.queryByText("Invoices")).not.toBeInTheDocument();
  });

  it("SBC-8 shows a retry state when the list fails", () => {
    hooks.usePlatformBillingOrganizations.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("boom"),
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByText("boom")).not.toBeInTheDocument();
  });
});
