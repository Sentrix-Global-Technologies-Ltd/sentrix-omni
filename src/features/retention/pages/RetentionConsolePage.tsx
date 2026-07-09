import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { humanize } from "../../../lib/format";
import { useRetentionActions, useStorage } from "../hooks/useRetention";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

function formatValue(key: string, value: unknown): string {
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

export default function RetentionConsolePage() {
  const storage = useStorage();
  const { sweep, archive, purge } = useRetentionActions();

  const entries = Object.entries(storage.data?.data ?? {}).filter(
    ([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean",
  );

  return (
    <>
      <PageMeta title="Retention | Sentrix Console" description="Storage usage & retention" />
      <PageHeader title="Retention & Storage" breadcrumbs={[{ label: "Retention" }]} />

      <div className={`${card} mb-6`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Storage usage</h3>
        {entries.length === 0 ? (
          <p className="mt-4 text-theme-sm text-gray-400">
            {storage.isLoading ? "Loading…" : "No storage data available."}
          </p>
        ) : (
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {entries.map(([k, v]) => (
              <div key={k}>
                <dt className="text-theme-xs text-gray-400">{humanize(k)}</dt>
                <dd className="mt-0.5 text-title-sm font-bold text-gray-800 dark:text-white/90">
                  {formatValue(k, v)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className={card}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Retention actions</h3>
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
              description="Generate an archive export of eligible evidence."
              confirmLabel="Export"
              successMessage="Archive export started"
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
              successMessage="Purge started"
              onConfirm={() => purge.mutateAsync()}
            />
          </Can>
        </div>
      </div>
    </>
  );
}
