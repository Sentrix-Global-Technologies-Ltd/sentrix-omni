import { Modal } from "../../../components/ui/modal";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import ErrorState from "../../../components/ui/state/ErrorState";
import { formatDateTime, formatMoney, humanize } from "../../../lib/format";
import { billingStatusTone, paymentBadge } from "./billingStatusTone";
import {
  usePlatformBillingIndividual,
  usePlatformBillingOrganization,
} from "../../billing/hooks/useBilling";
import type { Invoice, PlatformBillingPayment, PlatformBillingSegment } from "../../billing/api/billing.types";

export interface BillingCustomerTarget {
  segment: PlatformBillingSegment;
  id: string;
}

interface Props {
  target: BillingCustomerTarget | null;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-0.5 text-theme-sm text-gray-700 dark:text-gray-300">{children}</div>
    </div>
  );
}

const paymentColumns: Column<PlatformBillingPayment>[] = [
  {
    key: "reference",
    header: "Reference",
    render: (p) => <span className="font-mono text-theme-xs text-gray-600 dark:text-gray-300">{p.reference}</span>,
  },
  { key: "plan", header: "Plan", render: (p) => <span>{p.plan_name}</span> },
  {
    key: "amount",
    header: "Amount",
    render: (p) => (
      <div>
        <p>{formatMoney(p.amount_cents, p.currency)}</p>
        {p.tax_cents != null && p.subtotal_cents != null && (
          <p className="text-theme-xs text-gray-400">
            {formatMoney(p.subtotal_cents, p.currency)} + {formatMoney(p.tax_cents, p.currency)} tax
          </p>
        )}
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (p) => {
      const badge = paymentBadge(p);
      return <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>;
    },
  },
  {
    key: "date",
    header: "Date",
    render: (p) => (
      <span className="text-gray-500 dark:text-gray-400">{formatDateTime(p.paid_at ?? p.created_at)}</span>
    ),
  },
];

const invoiceColumns: Column<Invoice>[] = [
  { key: "number", header: "Invoice", render: (i) => <span className="font-medium">{i.number}</span> },
  { key: "plan", header: "Plan", render: (i) => <span>{humanize(i.plan_key)}</span> },
  { key: "amount", header: "Amount", render: (i) => <span>{formatMoney(i.amount_cents, i.currency)}</span> },
  { key: "status", header: "Status", render: (i) => <StatusBadge tone="success">{humanize(i.status)}</StatusBadge> },
  { key: "issued", header: "Issued", render: (i) => <span>{formatDateTime(i.issued_at)}</span> },
];

/**
 * Billing detail for one customer (SuperAdmin billing console): subscription
 * state, contact, and payment history. Organizations also show invoices; for
 * individuals the paid payment row IS the receipt (there is no consumer
 * invoice table). Read-only.
 */
export default function BillingCustomerDetailModal({ target, onClose }: Props) {
  const org = usePlatformBillingOrganization(target?.segment === "organizations" ? target.id : null);
  const person = usePlatformBillingIndividual(target?.segment === "individuals" ? target.id : null);

  if (!target) return null;

  const isOrg = target.segment === "organizations";
  const query = isOrg ? org : person;
  const customer = query.data?.data;
  const orgData = isOrg ? org.data?.data : undefined;
  const personData = !isOrg ? person.data?.data : undefined;
  const payments = isOrg ? orgData?.payments : personData?.receipts;

  return (
    <Modal isOpen onClose={onClose} className="mx-4 w-full max-w-3xl p-6">
      <div className="pr-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {isOrg ? "Organization billing" : "Individual billing"}
        </h3>
      </div>

      {query.isLoading && <p className="mt-6 text-theme-sm text-gray-400">Loading…</p>}
      {query.isError && (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} title="Could not load billing details" />
      )}

      {customer && (
        <>
          <div className="mt-5 flex items-start justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-800 dark:text-white/90">{customer.name}</p>
              <p className="truncate text-theme-xs text-gray-400">
                {isOrg ? orgData?.slug : personData?.email}
              </p>
            </div>
            <StatusBadge tone={billingStatusTone(customer.status)}>{humanize(customer.status)}</StatusBadge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
            <Field label="Plan">{customer.plan_name}</Field>
            <Field label="Auto-renew">
              {customer.auto_renew === null ? "—" : customer.auto_renew ? "On" : "Off"}
            </Field>
            <Field label="Last payment">{formatDateTime(customer.last_payment_at)}</Field>
            <Field label="Period ends">{formatDateTime(customer.current_period_end)}</Field>
            <Field label="Trial ends">{formatDateTime(customer.trial_ends_at)}</Field>
            <Field label="Customer since">{formatDateTime(customer.created_at)}</Field>
            {!customer.has_subscription_record && (
              <div className="col-span-2 md:col-span-3">
                <p className="text-theme-xs text-gray-400">
                  No subscription record yet — shown as Free until the customer picks a plan.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 md:grid-cols-3 dark:border-gray-800">
            {isOrg ? (
              <>
                <Field label="Owner">{orgData?.owner?.name ?? "—"}</Field>
                <Field label="Owner email">{orgData?.owner?.email ?? "—"}</Field>
                <Field label="Owner phone">{orgData?.owner?.phone ?? "—"}</Field>
                <Field label="Region">{orgData?.region ?? "—"}</Field>
              </>
            ) : (
              <>
                <Field label="Email">{personData?.email ?? "—"}</Field>
                <Field label="Phone">{personData?.phone ?? "—"}</Field>
                <Field label="Country">{personData?.country ?? "—"}</Field>
              </>
            )}
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
            <p className="mb-3 text-theme-xs font-medium uppercase tracking-wide text-gray-400">
              {isOrg ? "Payment history" : "Payments & receipts"}
            </p>
            <DataTable
              columns={paymentColumns}
              rows={payments ?? []}
              rowKey={(p) => p.reference}
              emptyTitle="No payments"
              emptyDescription="No payment has been attempted yet."
            />
          </div>

          {isOrg && (
            <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
              <p className="mb-3 text-theme-xs font-medium uppercase tracking-wide text-gray-400">Invoices</p>
              <DataTable
                columns={invoiceColumns}
                rows={orgData?.invoices ?? []}
                rowKey={(i) => i.id}
                emptyTitle="No invoices"
                emptyDescription="No invoice has been issued yet."
              />
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
