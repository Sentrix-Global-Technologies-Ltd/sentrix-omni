import { useMemo } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import EmptyState from "../../../components/ui/state/EmptyState";
import { AlertHexaIcon } from "../../../icons";
import { formatDateTime, humanize } from "../../../lib/format";
import "../../incidents/styles/incidents-centre.css";

import InvitationsCard from "../../settings/components/InvitationsCard";
import { useOrganizationDetails } from "../../settings/hooks/useOrganizationDetails";
import { useInvitations } from "../../settings/hooks/useInvitations";
import { useSubscription } from "../../billing/hooks/useBilling";
import { useStorage } from "../../retention/hooks/useRetention";
import { useWebhookHealth } from "../hooks/useWebhookHealth";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

function subscriptionTone(s: string): "success" | "warning" | "error" | "light" {
  if (s === "active") return "success";
  if (s === "past_due" || s === "pending") return "warning";
  if (s === "cancelled" || s === "canceled") return "error";
  return "light";
}

function subscriptionAccent(s: string): string {
  if (s === "active") return "ic-stat-accent--success";
  if (s === "past_due" || s === "pending") return "ic-stat-accent--warning";
  if (s === "cancelled" || s === "canceled") return "ic-stat-accent--critical";
  return "ic-stat-accent--neutral";
}

function formatStorageValue(key: string, value: unknown): string {
  if (typeof value === "number" && /bytes|size/i.test(key)) {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let n = value;
    let u = 0;
    while (n >= 1024 && u < units.length - 1) {
      n /= 1024;
      u++;
    }
    return `${n.toFixed(u === 0 ? 0 : 1)} ${units[u]}`;
  }
  return String(value);
}

/**
 * Account-health landing for organization administrators. Every widget reuses
 * an existing feature's hooks/components as-is (InvitationsCard verbatim;
 * subscription/storage read via their existing hooks). The failed-
 * delivery count (useWebhookHealth) reads the aggregate webhook-deliveries
 * endpoint's `meta.total` under a `success=0` filter — a single request, not
 * a per-webhook fan-out. Distinct from the Operations Command Center, which
 * stays dispatcher/supervisor-focused per its own brief.
 */
export default function AdminOverviewPage() {
  const org = useOrganizationDetails();
  const invitations = useInvitations();
  const subscription = useSubscription();
  const storage = useStorage();

  const { failedCount, isLoading: webhookHealthLoading } = useWebhookHealth();

  const pendingInvitations = (invitations.data?.data ?? []).filter((i) => i.status === "pending").length;
  const sub = subscription.data?.data;

  const storageEntries = Object.entries(storage.data?.data ?? {}).filter(
    ([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean",
  );

  return (
    <>
      <PageMeta title="Admin Overview | Sentrix Console" description="Organization account health" />
      <PageHeader
        title="Admin Overview"
        breadcrumbs={[{ label: "Admin Overview" }]}
        description={org.data?.data ? org.data.data.name : undefined}
      />

      {/* Critical account-health KPIs */}
      <div className="ic-kpi-grid">
        {/* Members */}
        <div className="ic-stat-card">
          <span className="ic-stat-label">Members</span>
          {org.isLoading ? (
            <span className="ic-stat-skeleton" />
          ) : (
            <span className="ic-stat-value">{org.data?.data?.members_count ?? 0}</span>
          )}
          <span className="ic-stat-accent ic-stat-accent--info" />
        </div>

        {/* Pending invitations */}
        <div className="ic-stat-card">
          <span className="ic-stat-label">Pending invitations</span>
          {invitations.isLoading ? (
            <span className="ic-stat-skeleton" />
          ) : (
            <span className="ic-stat-value">{pendingInvitations}</span>
          )}
          <span className="ic-stat-accent ic-stat-accent--warning" />
        </div>

        {/* Subscription */}
        <div className="ic-stat-card">
          <span className="ic-stat-label">Subscription</span>
          {subscription.isLoading ? (
            <span className="ic-stat-skeleton" />
          ) : (
            <span className="ic-stat-value" style={{ fontSize: "1.25rem" }}>
              {sub ? humanize(sub.status) : "—"}
            </span>
          )}
          <span className={`ic-stat-accent ${sub ? subscriptionAccent(sub.status) : "ic-stat-accent--neutral"}`} />
        </div>

        {/* Failed webhook deliveries */}
        <div className="ic-stat-card">
          <span className="ic-stat-label">Failed webhook deliveries</span>
          {webhookHealthLoading ? (
            <span className="ic-stat-skeleton" />
          ) : (
            <span className="ic-stat-value">{failedCount}</span>
          )}
          <span className={`ic-stat-accent ${failedCount > 0 ? "ic-stat-accent--critical" : "ic-stat-accent--success"}`} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-4 md:gap-6">
        {/* Full invitation management, reused verbatim from Settings. */}
        <div className="col-span-12 lg:col-span-8">
          <div className={card}>
            <InvitationsCard />
          </div>
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-4">
          <div className={card}>
            <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Billing</h3>
            {sub ? (
              <div>
                <p className="text-title-sm font-bold text-gray-800 dark:text-white/90">{sub.plan_name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-theme-sm text-gray-500 dark:text-gray-400">
                  <StatusBadge tone={subscriptionTone(sub.status)}>{sub.status}</StatusBadge>
                  {sub.current_period_end && <span>Renews {formatDateTime(sub.current_period_end)}</span>}
                </div>
              </div>
            ) : (
              <EmptyState title="No subscription" description={subscription.isLoading ? "Loading…" : "No active subscription."} />
            )}
          </div>

          <div className={card}>
            <div className="mb-3 flex items-center gap-2">
              <AlertHexaIcon className="size-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Storage &amp; retention</h3>
            </div>
            {storageEntries.length === 0 ? (
              <EmptyState title="No storage data" description={storage.isLoading ? "Loading…" : "No storage data available."} />
            ) : (
              <dl className="grid grid-cols-2 gap-3">
                {storageEntries.slice(0, 4).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-theme-xs text-gray-400">{humanize(k)}</dt>
                    <dd className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                      {formatStorageValue(k, v)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
