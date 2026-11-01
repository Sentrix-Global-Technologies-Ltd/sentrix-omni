import { useNavigate, Link } from "react-router";
import EmergencyTable from "../../emergencies/components/EmergencyTable";
import { useEmergencies } from "../../emergencies/hooks/useEmergencies";
import type { Emergency } from "../../emergencies/api/emergencies.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/**
 * Emergency summary — active (triggered) emergencies, same single-status list
 * convention as the KPI cards. Stays live through the emergencies realtime
 * hook already mounted on the page.
 */
export default function EmergencySummaryPanel() {
  const navigate = useNavigate();
  const query = useEmergencies({ status: "triggered" });
  const triggered = (query.data?.data ?? []).slice(0, 5);

  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Active emergencies</h3>
        <Link
          to="/emergencies?status=triggered"
          className="text-theme-sm font-medium text-brand-500 hover:text-brand-600"
        >
          View all
        </Link>
      </div>
      <EmergencyTable
        emergencies={triggered}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onRowClick={(e: Emergency) => navigate(`/emergencies/${e.id}`)}
        onView={(e: Emergency) => navigate(`/emergencies/${e.id}`)}
      />
    </div>
  );
}
