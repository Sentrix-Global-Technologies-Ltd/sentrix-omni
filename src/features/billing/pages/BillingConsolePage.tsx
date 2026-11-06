import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Button from "../../../components/ui/button/Button";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import { formatDateTime, formatMoney } from "../../../lib/format";
import { useOrganization } from "../../../context/OrganizationContext";
import { useBillingActions, useEntitlements, useInvoicePdfActions, useInvoices, usePlanOptions, usePlans, useSubscription } from "../hooks/useBilling";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { valueSizeClass } from "../../../components/shared/fitText";
import "../../incidents/styles/incidents-centre.css";
import CheckoutPanel from "./CheckoutPanel";
import CheckoutReturnBanner from "./CheckoutReturnBanner";
import type { Invoice } from "../api/billing.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/** Same card chrome as the Incidents KPI cards: bordered, with a coloured accent bar along the bottom. */
const accentCard = "ic-stat-card ic-stat-card--fit !gap-0 !p-5 !pb-6 md:!p-6 md:!pb-7";

function planAccent(key: string, popular: boolean): "neutral" | "info" | "success" {
  if (key === "free") return "neutral";
  return popular ? "success" : "info";
}

function subscriptionAccent(status?: string): "success" | "warning" | "critical" | "neutral" {
  if (status === "active") return "success";
  if (status === "trialing" || status === "past_due" || status === "pending") return "warning";
  if (status === "cancelled" || status === "canceled" || status === "expired") return "critical";
  return "neutral";
}

function statusTone(s: string): "success" | "warning" | "error" | "light" {
  if (s === "active") return "success";
  if (s === "trialing" || s === "past_due" || s === "pending") return "warning";
  if (s === "cancelled" || s === "canceled" || s === "expired") return "error";
  return "light";
}

export default function BillingConsolePage() {
  const { activeId } = useOrganization();
  const subQuery = useSubscription();
  const plansQuery = usePlans();
  const optionsQuery = usePlanOptions();
  const invoicesQuery = useInvoices();
  const { subscribe, cancel } = useBillingActions();
  const pdf = useInvoicePdfActions();
  const toast = useToast();

  const pdfError = (err: unknown) =>
    toast.error(err instanceof ApiError ? err.message : "Could not load the invoice. Please try again.");

  const sub = subQuery.data?.data;
  const plans = plansQuery.data?.data ?? [];
  const optionsByKey = new Map((optionsQuery.data?.data ?? []).map((o) => [o.key, o]));
  // The stored status never turns "expired" by itself; the server derives it.
  const status = sub?.derived_status ?? sub?.status;
  const invoices = invoicesQuery.data?.data ?? [];
  const hardware = useEntitlements().data?.data?.usage?.hardware;
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
    {
      key: "pdf",
      header: "Invoice PDF",
      render: (i) => (
        <span className="flex items-center gap-3 text-theme-sm">
          <button
            type="button"
            className="font-medium text-brand-500 hover:underline disabled:opacity-50"
            disabled={pdf.open.isPending}
            onClick={() => pdf.open.mutate(i.id, { onError: pdfError })}
          >
            View
          </button>
          <button
            type="button"
            className="font-medium text-gray-600 hover:underline disabled:opacity-50 dark:text-gray-300"
            disabled={pdf.download.isPending}
            onClick={() => pdf.download.mutate(i, { onError: pdfError })}
          >
            Download
          </button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Billing | Sentrix Console" description="Subscription & billing" />
      <PageHeader title="Billing" breadcrumbs={[{ label: "Billing" }]} />

      <CheckoutReturnBanner />

      {/* Current subscription */}
      <div className={`${accentCard} mb-6`}>
        <div className="flex w-full flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Current plan</h3>
            <p className="mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {sub?.plan_name ?? (subQuery.isLoading ? "…" : "—")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-theme-sm text-gray-500 dark:text-gray-400">
              {sub && status && (
                <StatusBadge tone={statusTone(status)}>{status.replace("_", " ")}</StatusBadge>
              )}
              {sub?.status === "trialing" && sub.trial_ends_at && (
                <span>Trial ends {formatDateTime(sub.trial_ends_at)}</span>
              )}
              {sub?.current_period_end && (
                <span>
                  {status === "expired"
                    ? "Expired"
                    : status === "past_due"
                      ? "Ended"
                    : status === "cancelled"
                      ? "Ends"
                      : "Active until"}{" "}
                  {formatDateTime(sub.current_period_end)}
                </span>
              )}
              {sub?.payment_method && <span>· {sub.payment_method}</span>}
            </div>
            {status === "past_due" && sub?.grace_ends_at && (
              <p className="mt-2 text-theme-sm text-warning-600 dark:text-warning-400">
                Your plan has ended. You keep full access until {formatDateTime(sub.grace_ends_at)}; renew before
                then to avoid moving to the Free plan.
              </p>
            )}
            {entitlements.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1">
                {entitlements.map((e) => (
                  <li key={e}>
                    <StatusBadge tone="light">{e}</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
            {hardware && hardware.limit !== null && (
              <p className="mt-3 text-theme-sm text-gray-600 dark:text-gray-400" data-testid="hardware-usage">
                Hardware devices: {hardware.used} of {hardware.limit} used
                {hardware.over_limit ? ". You are over this plan's device allowance; Pro Annual includes unlimited devices." : "."}
              </p>
            )}
          </div>
          {sub && (
            <div className="flex flex-wrap gap-2">
              {/*
                The auto-renew toggle is intentionally not shown: renewal is
                manual until card authorisations are stored (lifecycle Phase 6),
                so a toggle would promise something the system does not do.
              */}
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
        <div className={`ic-stat-accent ic-stat-accent--${subscriptionAccent(sub?.status)}`} />
      </div>

      {/* Plans */}
      <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Plans</h3>
      <div className="mb-6 grid grid-cols-12 gap-4 md:gap-6">
        {plans.map((p) => {
          const opt = optionsByKey.get(p.key);
          const current = sub?.plan_key === p.key;
          return (
            <div key={p.key} className="col-span-12 sm:col-span-6 xl:col-span-4">
              <div className={`${accentCard} h-full`}>
                <div className="flex w-full items-center justify-between">
                  <h4 className="font-semibold text-gray-800 dark:text-white/90">{p.name}</h4>
                  <span className="flex items-center gap-1">
                    {current && <StatusBadge tone="success">Current</StatusBadge>}
                    {p.popular && <StatusBadge tone="primary">Popular</StatusBadge>}
                  </span>
                </div>
                <p className={`mt-2 ${valueSizeClass(formatMoney(p.price_cents, p.currency))}`}>
                  {formatMoney(p.price_cents, p.currency)}
                  <span className="text-theme-sm font-normal text-gray-400"> / {p.interval}</span>
                </p>
                {p.price_cents > 0 && p.tax_cents ? (
                  <p className="mt-1 break-words text-theme-xs text-gray-500 dark:text-gray-400">
                    + {formatMoney(p.tax_cents, p.currency)} VAT ={" "}
                    {formatMoney(p.amount_cents ?? p.price_cents + p.tax_cents, p.currency)} at checkout
                  </p>
                ) : null}
                {p.entitlements.length > 0 && (
                  <ul className="mt-3 flex-1 space-y-1 text-theme-sm text-gray-500 dark:text-gray-400">
                    {p.entitlements.map((e) => (
                      <li key={e}>• {e}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-4">
                  {!opt ? null : opt.action === "current" ? (
                    <Button size="sm" variant="outline" disabled>
                      Current plan
                    </Button>
                  ) : !opt.allowed ? (
                    // The server says this change isn't available right now —
                    // show why instead of a button that would only fail.
                    <>
                      <Button size="sm" variant="outline" disabled>
                        {opt.label}
                      </Button>
                      {opt.reason && (
                        <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">{opt.reason}</p>
                      )}
                    </>
                  ) : opt.action === "downgrade_now" ? (
                    <div className="flex flex-wrap gap-2">
                      <ConfirmActionButton
                        label={opt.label}
                        triggerVariant="primary"
                        title={`Switch to ${p.name}?`}
                        description="You'll be moved to the free plan immediately. Your paid period has ended, so nothing is lost."
                        confirmLabel="Switch"
                        successMessage="Plan updated"
                        onConfirm={() => subscribe.mutateAsync(p.key)}
                      />
                    </div>
                  ) : (
                    <>
                      <CheckoutPanel plan={p} option={opt} />
                      {opt.reason && (
                        <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">{opt.reason}</p>
                      )}
                    </>
                  )}
                </div>
                <div className={`ic-stat-accent ic-stat-accent--${planAccent(p.key, p.popular)}`} />
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
