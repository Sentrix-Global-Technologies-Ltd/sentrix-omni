/**
 * BOP-1  A paid plan offers Extend and Move to Free, but not a complimentary grant.
 * BOP-2  A Free plan offers only the complimentary grant.
 * BOP-3  Confirm stays disabled until the reason is at least 10 characters.
 * BOP-4  Extend sends the days and the trimmed reason, then confirms with a toast.
 * BOP-5  Comp sends the chosen plan; a server rejection shows an error toast.
 * BOP-6  Override history shows who did what and why.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BillingOverridePanel from "./BillingOverridePanel";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("../../../components/shared/toast", () => ({ useToast: () => toast }));

const hooks = vi.hoisted(() => ({
  usePlans: vi.fn(),
  usePlatformBillingOverride: vi.fn(),
  usePlatformBillingOverrideHistory: vi.fn(),
}));
vi.mock("../../billing/hooks/useBilling", () => hooks);

const mutateAsync = vi.fn();
const REASON = "Goodwill after the outage.";

beforeEach(() => {
  vi.clearAllMocks();
  mutateAsync.mockResolvedValue({});
  hooks.usePlatformBillingOverride.mockReturnValue({ mutateAsync, isPending: false });
  hooks.usePlatformBillingOverrideHistory.mockReturnValue({ data: { data: [] } });
  hooks.usePlans.mockReturnValue({
    data: {
      data: [
        { key: "free", name: "Free", price_cents: 0 },
        { key: "pro_monthly", name: "Pro Monthly", price_cents: 500000 },
        { key: "pro_annual", name: "Pro Annual", price_cents: 5000000 },
      ],
    },
  });
});

const setup = (planKey: string, status = "active") =>
  render(<BillingOverridePanel organizationId="org-1" planKey={planKey} status={status} />);

describe("BillingOverridePanel", () => {
  it("BOP-1 a paid plan offers extend and downgrade, not comp", () => {
    setup("pro_monthly");
    expect(screen.getByRole("button", { name: "Extend period" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move to Free now" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Grant complimentary plan" })).toBeNull();
  });

  it("BOP-2 a Free plan offers only the complimentary grant", () => {
    setup("free");
    expect(screen.getByRole("button", { name: "Grant complimentary plan" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Extend period" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Move to Free now" })).toBeNull();
  });

  it("BOP-3 confirm needs a real reason", async () => {
    const user = userEvent.setup();
    setup("pro_monthly");
    await user.click(screen.getByRole("button", { name: "Extend period" }));
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Why is this override needed?"), "short");
    expect(confirm).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Why is this override needed?"), " but now long enough");
    expect(confirm).toBeEnabled();
  });

  it("BOP-4 extend sends days and the trimmed reason", async () => {
    const user = userEvent.setup();
    setup("pro_monthly");
    await user.click(screen.getByRole("button", { name: "Extend period" }));
    await user.type(screen.getByPlaceholderText("Why is this override needed?"), `  ${REASON}  `);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ kind: "extend", days: 30, reason: REASON }));
    expect(toast.success).toHaveBeenCalled();
  });

  it("BOP-5 comp sends the chosen plan and surfaces a server rejection", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValueOnce(new Error("nope"));
    setup("free");
    await user.click(screen.getByRole("button", { name: "Grant complimentary plan" }));
    await user.selectOptions(screen.getByRole("combobox"), "pro_annual");
    await user.type(screen.getByPlaceholderText("Why is this override needed?"), REASON);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ kind: "comp", plan_key: "pro_annual", days: 30, reason: REASON }),
    );
    expect(toast.error).toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("BOP-6 history shows the actor and the reason", () => {
    hooks.usePlatformBillingOverrideHistory.mockReturnValue({
      data: {
        data: [
          {
            id: "a1",
            action: "billing.override.extended",
            actor: { id: "u1", name: "Ada Admin", email: "ada@example.com" },
            reason: "Goodwill after the outage.",
            days: 7,
            plan_key: null,
            before: null,
            after: null,
            created_at: "2026-11-10T12:00:00Z",
          },
        ],
      },
    });
    setup("pro_monthly");
    expect(screen.getByText("Period extended")).toBeInTheDocument();
    expect(screen.getByText("+7 days")).toBeInTheDocument();
    expect(screen.getByText(/Ada Admin/)).toBeInTheDocument();
    expect(screen.getByText("Goodwill after the outage.")).toBeInTheDocument();
  });
});
