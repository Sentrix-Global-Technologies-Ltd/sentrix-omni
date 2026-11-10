import { useState } from "react";
import Button from "../../../components/ui/button/Button";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import Label from "../../../components/form/Label";
import { useToast } from "../../../components/shared/toast";
import { userMessage } from "../../../services/api/errors";
import { formatDateTime, humanize } from "../../../lib/format";
import {
  usePlans,
  usePlatformBillingOverride,
  usePlatformBillingOverrideHistory,
} from "../../billing/hooks/useBilling";
import type { BillingOverrideEntry, BillingOverridePayload } from "../../billing/api/billing.types";

type Kind = "extend" | "comp" | "downgrade";

interface Props {
  organizationId: string;
  planKey: string;
  /** Derived status from the billing console (active, trialing, expired, cancelled). */
  status: string;
}

const MIN_REASON = 10;
const MAX_DAYS = 365;

const TITLES: Record<Kind, string> = {
  extend: "Extend period",
  comp: "Grant complimentary plan",
  downgrade: "Move to Free now",
};

const ACTION_LABELS: Record<string, string> = {
  "billing.override.extended": "Period extended",
  "billing.override.comped": "Complimentary plan granted",
  "billing.override.downgraded": "Moved to Free",
};

function describe(entry: BillingOverrideEntry): string {
  if (entry.action === "billing.override.extended") return `+${entry.days ?? "?"} days`;
  if (entry.action === "billing.override.comped") return `${humanize(entry.plan_key ?? "")} for ${entry.days ?? "?"} days`;
  if (entry.action === "billing.override.downgraded") {
    return `${humanize(entry.before?.plan_key ?? "")} → Free`;
  }
  return "";
}

/**
 * SuperAdmin billing overrides for one organization (billing.override): extend
 * a paid period, grant a complimentary plan, or force a downgrade to Free. The
 * server enforces every rule and records an audit row with the reason; this
 * panel only collects the inputs. No payment or invoice is ever created.
 */
export default function BillingOverridePanel({ organizationId, planKey, status }: Props) {
  const toast = useToast();
  const override = usePlatformBillingOverride(organizationId);
  const history = usePlatformBillingOverrideHistory(organizationId);
  const plans = usePlans();

  const [kind, setKind] = useState<Kind | null>(null);
  const [days, setDays] = useState("30");
  const [compPlan, setCompPlan] = useState("pro_monthly");
  const [reason, setReason] = useState("");

  const isFree = planKey === "free";
  const canExtend = !isFree;
  const canComp = isFree || status === "expired";
  const canDowngrade = !isFree;

  const paidPlans = (plans.data?.data ?? []).filter((p) => p.price_cents > 0);
  const daysNumber = Number(days);
  const daysValid = Number.isInteger(daysNumber) && daysNumber >= 1 && daysNumber <= MAX_DAYS;
  const reasonValid = reason.trim().length >= MIN_REASON;
  const valid = reasonValid && (kind === "downgrade" || daysValid);

  const open = (next: Kind) => {
    setKind(next);
    setDays("30");
    setReason("");
  };

  const submit = async () => {
    if (kind === null || !valid) return;
    const trimmed = reason.trim();
    const payload: BillingOverridePayload =
      kind === "extend"
        ? { kind, days: daysNumber, reason: trimmed }
        : kind === "comp"
          ? { kind, plan_key: compPlan, days: daysNumber, reason: trimmed }
          : { kind, reason: trimmed };
    try {
      await override.mutateAsync(payload);
      toast.success(`${TITLES[kind]}: done.`);
      setKind(null);
    } catch (e) {
      toast.error(userMessage(e, "Could not apply the override."));
    }
  };

  const entries = history.data?.data ?? [];

  return (
    <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800" data-testid="override-panel">
      <p className="mb-3 text-theme-xs font-medium uppercase tracking-wide text-gray-400">Billing overrides</p>

      {kind === null ? (
        <div className="flex flex-wrap gap-2">
          {canExtend && (
            <Button size="sm" variant="outline" onClick={() => open("extend")}>
              Extend period
            </Button>
          )}
          {canComp && (
            <Button size="sm" variant="outline" onClick={() => open("comp")}>
              Grant complimentary plan
            </Button>
          )}
          {canDowngrade && (
            <Button size="sm" variant="outline" onClick={() => open("downgrade")}>
              Move to Free now
            </Button>
          )}
          {!canExtend && !canComp && !canDowngrade && (
            <p className="text-theme-sm text-gray-400">No override applies to this plan right now.</p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700" data-testid="override-form">
          <p className="font-medium text-gray-800 dark:text-white/90">{TITLES[kind]}</p>
          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
            {kind === "extend" &&
              "Adds days to the current paid period (counted from today if it has already ended). No payment or invoice is created."}
            {kind === "comp" &&
              "Gives the organization a paid plan free of charge for a set time, with auto-renew off. No payment or invoice is created."}
            {kind === "downgrade" &&
              "Moves the organization to the Free plan immediately. Devices, incidents and evidence are kept; paid features stop being included."}
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {kind === "comp" && (
              <div>
                <Label>Plan</Label>
                <select
                  value={compPlan}
                  onChange={(e) => setCompPlan(e.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  {paidPlans.map((p) => (
                    <option key={p.key} value={p.key} className="dark:bg-gray-900">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {kind !== "downgrade" && (
              <div>
                <Label>Days (1–{MAX_DAYS})</Label>
                <Input
                  type="number"
                  min="1"
                  max={String(MAX_DAYS)}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  error={!daysValid}
                />
              </div>
            )}
          </div>

          <div className="mt-3">
            <Label>Reason (recorded in the audit trail)</Label>
            <TextArea
              value={reason}
              onChange={setReason}
              rows={3}
              placeholder="Why is this override needed?"
              error={reason.length > 0 && !reasonValid}
              hint={`At least ${MIN_REASON} characters.`}
            />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={() => setKind(null)} disabled={override.isPending}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={() => void submit()} disabled={!valid || override.isPending}>
              {override.isPending ? "Applying…" : "Confirm"}
            </Button>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="mt-4" data-testid="override-history">
          <p className="mb-2 text-theme-xs font-medium uppercase tracking-wide text-gray-400">Override history</p>
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id} className="rounded-lg border border-gray-100 p-3 text-theme-sm dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="info">{ACTION_LABELS[e.action] ?? humanize(e.action)}</StatusBadge>
                  <span className="text-gray-700 dark:text-gray-300">{describe(e)}</span>
                  <span className="ml-auto text-theme-xs text-gray-400">
                    {e.actor?.name ?? "Unknown"} · {formatDateTime(e.created_at)}
                  </span>
                </div>
                {e.reason && <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{e.reason}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
