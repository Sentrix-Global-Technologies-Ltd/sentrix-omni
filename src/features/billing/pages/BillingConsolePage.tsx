import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Button from "../../../components/ui/button/Button";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import { formatDateTime } from "../../../lib/format";
import { useOrganization } from "../../../context/OrganizationContext";
import { useBillingActions, useInvoices, usePlans, useSubscription } from "../hooks/useBilling";
import CheckoutPanel from "./CheckoutPanel";
import CheckoutReturnBanner from "./CheckoutReturnBanner";
import type { Invoice } from "../api/billing.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

function statusTone(s: string): "success" | "warning" | "error" | "light" {
  if (s === "active") return "success";
  if (s === "trialing" || s === "past_due" || s === "pending") return "warning";
  if (s === "cancelled" || s === "canceled") return "error";
  return "light";
}

export default function BillingConsolePage() {
  const { activeId } = useOrganization();
  const subQuery = useSubscription();
  const plansQuery = usePlans();
  const invoicesQuery = useInvoices();
  const { subscribe, cancel, autoRenew } = useBillingActions();

  const sub = subQuery.data?.data;
  const plans = plansQuery.data?.data ?? [];
  const invoices = invoicesQuery.data?.data ?? [];
  const entitlements = Array.isArray(sub?.entitlements) ? (sub?.entitlements as string[]) : [];

  if (!activeId) {
    return (
      <>
        <PageMeta title="Billing | Sentrix Console" description="Subscription & billing" />
        <PageHeader title="Billing" breadcrumbs={[{ label: "Billing" }]} />
        <div className={card}>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            No active organization — billing is managed per organization.
          </p>
        </div>
      </>
    );
  }

  const invoiceColumns: Column<Invoice>[] = [
    {
      key: "number",
      header: "Invoice",
      render: (i) => <span className="font-mono text-theme-sm text-gray-800 dark:text-white/90">{i.number}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      render: (i) => (
        <span className="tabular-nums text-gray-700 dark:text-gray-200">
          {i.currency} {i.amount}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (i) => <StatusBadge tone={statusTone(i.status)}>{i.status}</StatusBadge>,
    },
    {
      key: "issued",
      header: "Issued",
      render: (i) => <span className="text-gray-500 dark:text-gray-400">{formatDateTime(i.issued_at)}</span>,
    },
  ];

  return (
    <>
      <PageMeta title="Billing | Sentrix Console" description="Subscription & billing" />
      <PageHeader title="Billing" breadcrumbs={[{ label: "Billing" }]} />

      <CheckoutReturnBanner />

      {/* Current subscription */}
      <div className={`${card} mb-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Current plan</h3>
            <p className="mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {sub?.plan_name ?? (subQuery.isLoading ? "…" : "—")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-theme-sm text-gray-500 dark:text-gray-400">
              {sub && <StatusBadge tone={statusTone(sub.status)}>{sub.status}</StatusBadge>}
              {sub?.status === "trialing" && sub.trial_ends_at && (
                <span>Trial ends {formatDateTime(sub.trial_ends_at)}</span>
              )}
              {sub?.current_period_end && <span>Renews {formatDateTime(sub.current_period_end)}</span>}
              {sub?.payment_method && <span>· {sub.payment_method}</span>}
            </div>
            {entitlements.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1">
                {entitlements.map((e) => (
                  <li key={e}>
                    <StatusBadge tone="light">{e}</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {sub && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={autoRenew.isPending}
                onClick={() => autoRenew.mutate(!sub.auto_renew)}
              >
                Auto-renew: {sub.auto_renew ? "On" : "Off"}
              </Button>
              {/*
                Cancel only makes sense with a paid plan to walk away from —
                cancelling while already on Free has nothing to end (there's
                no "no plan" state in this system; Free is always the floor),
                so the button previously showed for Free too and did nothing
                meaningful beyond marking the row "cancelled" for no reason.
              */}
              {sub.status === "active" && sub.plan_key !== "free" && (
                <ConfirmActionButton
                  label="Cancel plan"
                  tone="danger"
                  title="Cancel subscription?"
                  description="Your plan stays active until the end of the current period, then will not renew."
                  confirmLabel="Cancel plan"
                  successMessage="Subscription cancelled"
                  onConfirm={() => cancel.mutateAsync()}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Plans */}
      <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Plans</h3>
      <div className="mb-6 grid grid-cols-12 gap-4 md:gap-6">
        {plans.map((p) => {
          const current = sub?.plan_key === p.key;
          return (
            <div key={p.key} className="col-span-12 sm:col-span-6 xl:col-span-4">
              <div className={`${card} flex h-full flex-col ${p.popular ? "ring-1 ring-brand-400" : ""}`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800 dark:text-white/90">{p.name}</h4>
                  {p.popular && <StatusBadge tone="primary">Popular</StatusBadge>}
                </div>
                <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                  {p.currency} {p.price}
                  <span className="text-theme-sm font-normal text-gray-400"> / {p.interval}</span>
                </p>
                {p.entitlements.length > 0 && (
                  <ul className="mt-3 flex-1 space-y-1 text-theme-sm text-gray-500 dark:text-gray-400">
                    {p.entitlements.map((e) => (
                      <li key={e}>• {e}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-4">
                  {current ? (
                    <Button size="sm" variant="outline" disabled>
                      Current plan
                    </Button>
                  ) : p.price_cents === 0 ? (
                    // Free has no payment to collect — switch takes effect
                    // immediately, no PSP checkout step at all.
                    <div className="flex flex-wrap gap-2">
                      <ConfirmActionButton
                        label={`Switch to ${p.name}`}
                        triggerVariant="primary"
                        title={`Switch to ${p.name}?`}
                        description="You'll be moved to the free plan immediately, effective now."
                        confirmLabel="Switch"
                        successMessage="Plan updated"
                        onConfirm={() => subscribe.mutateAsync(p.key)}
                      />
                    </div>
                  ) : null}
                </div>
                {/*
                  Paid plans go through PSP checkout only — a direct "switch"
                  call would blind-charge the payment provider, which real
                  gateways (e.g. Paystack) can't do without a prior saved
                  authorization and honestly report as failed. Checkout is the
                  one path that actually works for a real paid upgrade.
                */}
                {!current && p.price_cents > 0 && <CheckoutPanel plan={p} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoices */}
      <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Invoices</h3>
      <DataTable
        columns={invoiceColumns}
        rows={invoices}
        rowKey={(i) => i.id}
        isLoading={invoicesQuery.isLoading}
        error={invoicesQuery.error}
        onRetry={() => void invoicesQuery.refetch()}
        emptyTitle="No invoices"
        emptyDescription="Invoices will appear here once you're billed."
      />
    </>
  );
}
