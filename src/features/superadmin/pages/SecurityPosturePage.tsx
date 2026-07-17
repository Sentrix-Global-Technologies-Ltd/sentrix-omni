import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import { useSecurityPosture } from "../hooks/useSecurityPosture";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

const rowLabel = "text-theme-xs text-gray-400";
const rowValue = "text-theme-sm font-medium text-gray-800 dark:text-white/90";

/**
 * Sentrix Console (platform-staff) — read-only report of the API's own
 * security posture. Every value is live config (config/cors.php,
 * config/sanctum.php, the `auth` RateLimiter, SecurityHeaders middleware),
 * not a static description — see PlatformSecurityController::posture().
 */
export default function SecurityPosturePage() {
  const query = useSecurityPosture();
  const p = query.data?.data;

  return (
    <>
      <PageMeta title="Security Posture | Sentrix Console" description="Platform security configuration" />
      <PageHeader
        title="Security Posture"
        breadcrumbs={[{ label: "SuperAdmin", to: "/superadmin" }, { label: "Security Posture" }]}
      />

      {query.isLoading ? (
        <p className="text-theme-sm text-gray-400">Loading…</p>
      ) : !p ? (
        <p className="text-theme-sm text-gray-400">Could not load security posture.</p>
      ) : (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 lg:col-span-6">
            <div className={card}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Authentication</h3>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <dt className={rowLabel}>Guard</dt>
                  <dd className={rowValue}>{p.auth.guard}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className={rowLabel}>Token expiration</dt>
                  <dd className={rowValue}>
                    {p.auth.token_expiration_minutes === null
                      ? "Non-expiring"
                      : `${p.auth.token_expiration_minutes} min`}
                  </dd>
                </div>
                <div>
                  <dt className={rowLabel}>Stateful domains</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {p.auth.stateful_domains.map((d) => (
                      <span key={d} className="rounded-full bg-gray-100 px-2 py-0.5 text-theme-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
                        {d}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className={card}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">CORS</h3>
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className={rowLabel}>Allowed origins</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {p.cors.allowed_origins.map((o) => (
                      <span key={o} className="rounded-full bg-gray-100 px-2 py-0.5 text-theme-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
                        {o}
                      </span>
                    ))}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className={rowLabel}>Credentials (cookies)</dt>
                  <dd className={rowValue}>{p.cors.supports_credentials ? "Enabled" : "Disabled"}</dd>
                </div>
                <div>
                  <dt className={rowLabel}>Covered paths</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {p.cors.paths.map((path) => (
                      <span key={path} className="rounded-full bg-gray-100 px-2 py-0.5 text-theme-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
                        {path}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className={card}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Rate limits</h3>
              <div className="mt-4 space-y-4">
                {Object.entries(p.rate_limits).map(([key, limit]) => (
                  <div key={key}>
                    <p className={rowValue}>{key.replace(/_/g, " ")}</p>
                    <p className="mt-0.5 text-theme-xs text-gray-400">{limit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className={card}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Response headers</h3>
              <dl className="mt-4 space-y-2.5">
                {Object.entries(p.response_headers).map(([header, value]) => (
                  <div key={header}>
                    <dt className="text-theme-xs font-medium text-gray-800 dark:text-white/90">{header}</dt>
                    <dd className="text-theme-xs text-gray-400">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
