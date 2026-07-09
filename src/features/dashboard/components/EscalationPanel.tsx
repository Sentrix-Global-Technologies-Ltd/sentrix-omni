import { useNavigate, Link } from "react-router";
import EmptyState from "../../../components/ui/state/EmptyState";
import IncidentTable from "../../incidents/components/IncidentTable";
import AssignmentTable from "../../assignments/components/AssignmentTable";
import { useIncidents } from "../../incidents/hooks/useIncidents";
import { useAssignments } from "../../assignments/hooks/useAssignments";
import type { Incident } from "../../incidents/api/incidents.types";
import type { Assignment } from "../../assignments/api/assignments.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/**
 * Escalation panel — incidents and dispatches that have escalated and need
 * supervisor attention. Both are single-status list queries (same convention
 * as the KPI cards) and stay live through the incidents/assignments realtime
 * hooks already mounted on the page.
 */
export default function EscalationPanel() {
  const navigate = useNavigate();
  const escalatedIncidents = useIncidents({ status: "escalated" });
  const escalatedAssignments = useAssignments({ status: "escalated" });

  const incidents = (escalatedIncidents.data?.data ?? []).slice(0, 3);
  const assignments = (escalatedAssignments.data?.data ?? []).slice(0, 3);
  const isEmpty =
    !escalatedIncidents.isLoading &&
    !escalatedAssignments.isLoading &&
    incidents.length === 0 &&
    assignments.length === 0;

  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Escalations</h3>
      </div>

      {isEmpty ? (
        <EmptyState title="No escalations" description="Nothing currently needs supervisor attention." />
      ) : (
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
                Escalated incidents
              </h4>
              <Link
                to="/incidents?status=escalated"
                className="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
              >
                View all
              </Link>
            </div>
            <IncidentTable
              incidents={incidents}
              isLoading={escalatedIncidents.isLoading}
              error={escalatedIncidents.error}
              onRetry={() => void escalatedIncidents.refetch()}
              onRowClick={(i: Incident) => navigate(`/incidents/${i.id}`)}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
                Escalated dispatches
              </h4>
              <Link
                to="/assignments?status=escalated"
                className="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
              >
                View all
              </Link>
            </div>
            <AssignmentTable
              assignments={assignments}
              isLoading={escalatedAssignments.isLoading}
              error={escalatedAssignments.error}
              onRetry={() => void escalatedAssignments.refetch()}
              onRowClick={(a: Assignment) => navigate(`/assignments/${a.id}`)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
