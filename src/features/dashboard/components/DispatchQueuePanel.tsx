import { useNavigate, Link } from "react-router";
import AssignmentTable from "../../assignments/components/AssignmentTable";
import { useAssignments } from "../../assignments/hooks/useAssignments";
import type { Assignment } from "../../assignments/api/assignments.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/**
 * Dispatch queue — assignments opened but not yet filled (status "pending"),
 * the same single-status list convention as the KPI cards. Stays live through
 * the assignments realtime hook already mounted on the page.
 */
export default function DispatchQueuePanel() {
  const navigate = useNavigate();
  const query = useAssignments({ status: "pending" });
  const pending = (query.data?.data ?? []).slice(0, 5);

  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Dispatch queue</h3>
        <Link
          to="/assignments?status=pending"
          className="text-theme-sm font-medium text-brand-500 hover:text-brand-600"
        >
          View all
        </Link>
      </div>
      <AssignmentTable
        assignments={pending}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onRowClick={(a: Assignment) => navigate(`/assignments/${a.id}`)}
      />
    </div>
  );
}
