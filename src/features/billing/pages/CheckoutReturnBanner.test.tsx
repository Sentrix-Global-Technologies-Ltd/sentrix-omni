/**
 * CRB-1  No reference in the URL renders nothing.
 * CRB-2  Pending payment shows "Confirming" and polling is enabled.
 * CRB-3  Paid payment shows success.
 * CRB-4  Failed payment shows the not-completed message.
 * CRB-5  Dismiss removes the reference from the URL.
 * CRB-6  Only absolute https checkout URLs count as hosted checkout.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router";
import CheckoutReturnBanner from "./CheckoutReturnBanner";
import { isHostedCheckoutUrl } from "./hostedCheckout";

const hooks = vi.hoisted(() => ({ useCheckoutStatus: vi.fn() }));
vi.mock("../hooks/useBilling", () => hooks);
vi.mock("../../../context/OrganizationContext", () => ({ useOrganization: () => ({ activeId: "org-1" }) }));

function Where() {
  return <span data-testid="loc">{useLocation().search}</span>;
}

function setup(url: string) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[url]}>
        <CheckoutReturnBanner />
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockStatus = (status?: string) =>
  hooks.useCheckoutStatus.mockReturnValue({
    data: status ? { data: { status } } : undefined,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  });

beforeEach(() => vi.clearAllMocks());

describe("CheckoutReturnBanner", () => {
  it("CRB-1 renders nothing without a reference", () => {
    mockStatus();
    setup("/billing");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("CRB-2 pending shows confirming and polls", () => {
    mockStatus("pending");
    setup("/billing?reference=pay_abc&trxref=pay_abc");
    expect(screen.getByText("Confirming your payment…")).toBeInTheDocument();
    expect(hooks.useCheckoutStatus).toHaveBeenCalledWith("pay_abc", { poll: true });
  });

  it("CRB-3 paid shows success", () => {
    mockStatus("paid");
    setup("/billing?reference=pay_abc");
    expect(screen.getByText(/Payment received/)).toBeInTheDocument();
  });

  it("CRB-4 failed shows not completed", () => {
    mockStatus("failed");
    setup("/billing?reference=pay_abc");
    expect(screen.getByText(/not completed/)).toBeInTheDocument();
  });

  it("CRB-5 dismiss clears the reference", async () => {
    mockStatus("paid");
    setup("/billing?reference=pay_abc&trxref=pay_abc");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.getByTestId("loc").textContent).toBe("");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("CRB-6 hosted checkout URL detection", () => {
    expect(isHostedCheckoutUrl("https://checkout.paystack.com/abc")).toBe(true);
    expect(isHostedCheckoutUrl("/billing/sandbox/pay_1")).toBe(false);
    expect(isHostedCheckoutUrl("http://evil.test/x")).toBe(false);
    expect(isHostedCheckoutUrl("javascript:alert(1)")).toBe(false);
    expect(isHostedCheckoutUrl("")).toBe(false);
  });
});
