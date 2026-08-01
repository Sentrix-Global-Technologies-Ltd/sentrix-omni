import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import StatCard from "../../../components/shared/StatCard";
import { BoxIconLine, CheckCircleIcon, LockIcon, TrashBinIcon } from "../../../icons";
import { useRetentionActions, useStorage } from "../../retention/hooks/useRetention";

function formatBytes(n: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v.toFixed(u === 0 ? 0 : 1)} ${units[u]}`;
}

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/**
 * Retention Policy tab — reuses the SAME storage usage read and sweep/archive/
 * purge mutations as the standalone Retention console (features/retention),
 * just surfaced inline where the screenshots put it (a tab of Evidence Vault)
 * rather than as a second implementation.
 */
export default function RetentionPolicyPanel() {
  const storage = useStorage();
  const { sweep, archive, purge } = useRetentionActions();
  const s = storage.data?.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Storage used"
            tone="info"
            icon={<BoxIconLine className="size-6" />}
            loading={storage.isLoading}
            value={s ? `${formatBytes(s.estimated_bytes)} (${s.pct_of_quota.toFixed(1)}%)` : "—"}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="On legal hold"
            tone="error"
            icon={<LockIcon className="size-6" />}
            loading={storage.isLoading}
            value={s?.on_legal_hold ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Archived"
            tone="warning"
            icon={<TrashBinIcon className="size-6" />}
            loading={storage.isLoading}
            value={s?.archived ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Plan"
            tone="success"
            icon={<CheckCircleIcon className="size-6" />}
            loading={storage.isLoading}
            value={s?.plan ?? "—"}
          />
        </div>
      </div>

      <div className={card}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Policy windows</h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Age-based tiering for this organization's plan ({s?.plan ?? "—"}).
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-theme-xs text-gray-400">Hot</dt>
            <dd className="mt-0.5 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {s ? `${s.policy.hot_days}d` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-400">Warm</dt>
            <dd className="mt-0.5 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {s ? `${s.policy.warm_days}d` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-400">Cold</dt>
            <dd className="mt-0.5 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {s ? `${s.policy.cold_days}d` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-400">Evidence retention</dt>
            <dd className="mt-0.5 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {s ? `${s.policy.evidence_days}d` : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className={card}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Lifecycle actions</h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Apply retention policy, export an archive, or purge data past its retention tier.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Can permission="retention.manage">
            <ConfirmActionButton
              label="Run retention sweep"
              title="Run retention sweep?"
              description="Apply retention policy now: tier transitions and expiries are processed."
              confirmLabel="Run sweep"
              successMessage="Retention sweep started"
              onConfirm={() => sweep.mutateAsync()}
            />
          </Can>
          <Can permission="retention.archive">
            <ConfirmActionButton
              label="Export archive"
              title="Export evidence archive?"
              description="Generate an archive export of eligible evidence — it will appear in the Exports tab."
              confirmLabel="Export"
              successMessage="Archive export created"
              onConfirm={() => archive.mutateAsync()}
            />
          </Can>
          <Can permission="retention.purge">
            <ConfirmActionButton
              label="Purge expired"
              tone="danger"
              title="Purge expired evidence?"
              description="Permanently delete evidence past its retention tier. This cannot be undone."
              confirmLabel="Purge"
              successMessage="Purge complete"
              onConfirm={() => purge.mutateAsync()}
            />
          </Can>
        </div>
      </div>
    </div>
  );
}
