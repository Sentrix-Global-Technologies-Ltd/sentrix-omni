/**
 * BCP-1  Each invoice row has View and Download actions.
 * BCP-2  View opens that invoice's PDF; Download downloads it.
 * BCP-3  A failed PDF request shows an error toast instead of failing silently.
 * BCP-4  Plan prices use the fit-to-card sizing and show the VAT line.
 * BCP-5  A change the server forbids (Annual → Monthly mid-term) shows its label and reason, with no pay button.
 * BCP-6  Allowed changes render the checkout action with the server's option.
 * BCP-7  An expired paid plan reads "Expired", not "Renews".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import BillingConsolePage from "./BillingConsolePage";

vi.mock("../../../components/common/PageMeta", () => ({ default: () => null }));
vi.mock("../../../context/OrganizationContext", () => ({ useOrganization: () => ({ activeId: "org-1" }) }));
vi.mock("./CheckoutPanel", () => ({
  default: ({ plan, option }: { plan: { key: string }; option: { label: string } }) => (
    <button type="button" data-testid={`pay-${plan.key}`}>{option.label}</button>
  ),
}));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("../../../components/shared/toast", () => ({ useToast: () => toast }));

const hooks = vi.hoisted(() => ({
  useSubscription: vi.fn(),
  usePlans: vi.fn(),
  useInvoices: vi.fn(),
  useBillingActions: vi.fn(),
  useInvoicePdfActions: vi.fn(),
  useCheckoutStatus: vi.fn(),
  usePlanOptions: vi.fn(),
}));
vi.mock("../hooks/useBilling", () => hooks);

const open = vi.fn();
const download = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  hooks.usePlanOptions.mockReturnValue({
    data: {
      data: [
        { key: "free", name: "Free", action: "current", allowed: false, immediate: false, label: "Current plan", reason: null, effective_at: null, price: { currency: "NGN", subtotal_cents: 0, credit_cents: 0, tax_cents: 0, amount_cents: 0 } },
        { key: "pro_annual", name: "Pro Annual", action: "subscribe", allowed: true, immediate: true, label: "Subscribe & pay", reason: null, effective_at: null, price: { currency: "NGN", subtotal_cents: 500000000, credit_cents: 0, tax_cents: 37500000, amount_cents: 537500000 } },
      ],
    },
  });
  hooks.useCheckoutStatus.mockReturnValue({ data: undefined, isFetching: false, isError: false, refetch: vi.fn() });
  hooks.useSubscription.mockReturnValue({
    data: { data: { plan_key: "free", plan_name: "Free", status: "active", auto_renew: true, entitlements: [] } },
    isLoading: false,
  });
  hooks.usePlans.mockReturnValue({
    data: {
      data: [
        { key: "free", name: "Free", price_cents: 0, price: "0.00", currency: "NGN", interval: "none", popular: false, entitlements: [] },
        {
          key: "pro_annual",
          name: "Pro Annual",
          price_cents: 500000000,
          price: "5,000,000.00",
          tax_cents: 37500000,
          amount_cents: 537500000,
          currency: "NGN",
          interval: "year",
          popular: true,
          entitlements: [],
        },
      ],
    },
  });
  hooks.useInvoices.mockReturnValue({
    data: {
      data: [
        { id: "inv-1", number: "INV-1", plan_key: "pro_annual", amount_cents: 537500000, amount: "5,375,000.00", currency: "NGN", status: "paid", issued_at: "2026-11-04T10:00:00Z" },
      ],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
  hooks.useBillingActions.mockReturnValue({
    subscribe: { mutateAsync: vi.fn() },
    cancel: { mutateAsync: vi.fn() },
    autoRenew: { mutate: vi.fn(), isPending: false },
  });
  hooks.useInvoicePdfActions.mockReturnValue({
    open: { mutate: open, isPending: false },
    download: { mutate: download, isPending: false },
  });
});

const setup = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <BillingConsolePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("BillingConsolePage", () => {
  it("BCP-1 invoice rows have View and Download", () => {
    setup();
    expect(screen.getByRole("columnheader", { name: "Invoice PDF" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
  });

  it("BCP-2 View opens and Download downloads that invoice", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: "View" }));
    expect(open.mock.calls[0][0]).toBe("inv-1");
    await userEvent.click(screen.getByRole("button", { name: "Download" }));
    expect(download.mock.calls[0][0]).toMatchObject({ id: "inv-1", number: "INV-1" });
  });

  it("BCP-3 a failed PDF request shows a toast", async () => {
    open.mockImplementation((_id: string, opts: { onError: (e: unknown) => void }) => opts.onError(new Error("x")));
    setup();
    await userEvent.click(screen.getByRole("button", { name: "View" }));
    expect(toast.error).toHaveBeenCalledWith("Could not load the invoice. Please try again.");
  });

  it("BCP-4 plan price is fit-sized and shows VAT", () => {
    setup();
    const price = screen.getByText(/5,000,000\.00/, { selector: "p" });
    expect(price.className).toMatch(/ic-stat-value--fit/);
    expect(price.className).toMatch(/ic-stat-value--(sm|xs)/);
    expect(screen.getByText(/VAT =/).textContent).toMatch(/at checkout/);
  });

  it("BCP-5 a forbidden change shows its label and reason, no pay button", () => {
    hooks.useSubscription.mockReturnValue({
      data: { data: { plan_key: "pro_annual", plan_name: "Pro Annual", status: "active", derived_status: "active", auto_renew: true, entitlements: [], current_period_end: "2027-11-04T10:00:00Z" } },
      isLoading: false,
    });
    hooks.usePlans.mockReturnValue({
      data: { data: [{ key: "pro_monthly", name: "Pro Monthly", price_cents: 50000000, price: "500,000.00", currency: "NGN", interval: "month", popular: false, entitlements: [] }] },
    });
    hooks.usePlanOptions.mockReturnValue({
      data: {
        data: [
          { key: "pro_monthly", name: "Pro Monthly", action: "scheduled_downgrade", allowed: false, immediate: false, label: "Available from 4 Nov 2027", reason: "You're on Pro Annual until 4 Nov 2027. Pro Monthly becomes available when your plan ends.", effective_at: "2027-11-04T10:00:00Z", price: { currency: "NGN", subtotal_cents: 0, credit_cents: 0, tax_cents: 0, amount_cents: 0 } },
        ],
      },
    });
    setup();
    expect(screen.getByRole("button", { name: "Available from 4 Nov 2027" })).toBeDisabled();
    expect(screen.getByText(/becomes available when your plan ends/)).toBeInTheDocument();
    expect(screen.queryByTestId("pay-pro_monthly")).toBeNull();
  });

  it("BCP-6 an allowed change renders the checkout action", () => {
    setup();
    expect(screen.getByTestId("pay-pro_annual")).toHaveTextContent("Subscribe & pay");
  });

  it("BCP-7 an expired plan reads Expired, not Renews", () => {
    hooks.useSubscription.mockReturnValue({
      data: { data: { plan_key: "pro_monthly", plan_name: "Pro Monthly", status: "active", derived_status: "expired", auto_renew: true, entitlements: [], current_period_end: "2026-10-01T10:00:00Z" } },
      isLoading: false,
    });
    setup();
    expect(screen.getByText(/^Expired/)).toBeInTheDocument();
    expect(screen.queryByText(/Renews/)).toBeNull();
  });
});
