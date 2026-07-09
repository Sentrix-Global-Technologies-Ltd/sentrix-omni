import { useMemo } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import StatCard from "../../../components/shared/StatCard";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import EmptyState from "../../../components/ui/state/EmptyState";
import { AlertHexaIcon, DollarLineIcon, GroupIcon, PlugInIcon } from "../../../icons";
import { formatDateTime, humanize } from "../../../lib/format";

import InvitationsCard from "../../settings/components/InvitationsCard";
import { useOrganizationDetails } from "../../settings/hooks/useOrganizationDetails";
import { useInvitations } from "../../settings/hooks/useInvitations";
import { useSubscription } from "../../billing/hooks/useBilling";
import { useWebhooks } from "../../webhooks/hooks/useWebhooks";
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
 * subscription/webhooks/storage read via their existing hooks). The failed-
 * delivery count (useWebhookHealth) reads the aggregate webhook-deliveries
 * endpoint's `meta.total` under a `success=0` filter — a single request, not
 * a per-webhook fan-out. Distinct from the Operations Command Center, which
 * stays dispatcher/supervisor-focused per its own brief.
 */
export default function AdminOverviewPage() {
  const org = useOrganizationDetails();
  const invitations = useInvitations();
  const subscription = useSubscription();
  const webhooks = useWebhooks();
  const storage = useStorage();

  const allWebhooks = useMemo(() => webhooks.data?.data ?? [], [webhooks.data]);
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
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Members"
            tone="info"
            icon={<GroupIcon className="size-6" />}
            loading={org.isLoading}
            value={org.data?.data?.members_count ?? 0}
            to="/settings"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Pending invitations"
            tone="warning"
            icon={<GroupIcon className="size-6" />}
            loading={invitations.isLoading}
            value={pendingInvitations}
            to="/settings"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Subscription"
            tone={sub ? subscriptionTone(sub.status) : "light"}
            icon={<DollarLineIcon className="size-6" />}
            loading={subscription.isLoading}
            value={sub ? humanize(sub.status) : "—"}
            to="/billing"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Failed webhook deliveries"
            tone={failedCount > 0 ? "error" : "success"}
            icon={<PlugInIcon className="size-6" />}
            loading={webhookHealthLoading}
            value={failedCount}
            to="/webhooks"
          />
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
            <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Webhooks</h3>
            {allWebhooks.length === 0 ? (
              <EmptyState title="No webhooks" description={webhooks.isLoading ? "Loading…" : "No webhooks configured."} />
            ) : (
              <ul className="space-y-2">
                {allWebhooks.map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800">
                    <span className="truncate text-theme-sm text-gray-700 dark:text-gray-300">{w.url}</span>
                    <StatusBadge tone={w.active ? "success" : "light"}>{w.active ? "Active" : "Inactive"}</StatusBadge>
                  </li>
                ))}
              </ul>
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
