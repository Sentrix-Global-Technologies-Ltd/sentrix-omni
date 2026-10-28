import { Modal } from "../../../components/ui/modal";
import AuditTable from "../../audit/components/AuditTable";
import { useAuditLogs } from "../../audit/hooks/useAuditLogs";
import type { Observation } from "../api/evidence.types";

interface Props {
  observation: Observation | null;
  onClose: () => void;
}

/** Returns true for demo observations whose IDs are not valid UUIDs.
 * Passing a non-UUID to the audit_logs query causes a PostgreSQL
 * SQLSTATE[22P02] "invalid input syntax for type uuid" error. */
function isDemoObservation(o: Observation): boolean {
  return o.id.startsWith("demo-") || o.organization_id === "demo";
}

/**
 * Chain-of-custody viewer for a single observation — every action ever taken
 * on it (ingest, hold/release, bookmark, archive, collection membership),
 * newest first. Reuses the SAME Audit domain and AuditTable the standalone
 * /audit console uses; the only difference is the subject_type/subject_id
 * filter that scopes the query to this one record (see AuditLogController).
 */
export default function CustodyModal({ observation, onClose }: Props) {
  const isDemo = Boolean(observation && isDemoObservation(observation));

  /*
   * For demo observations the ID is not a UUID ("demo-1", etc.).
   * Passing it to the audit log query causes a PostgreSQL type-cast error.
   * Setting subject_id to undefined disables the query (useAuditLogs requires
   * both subject_type AND subject_id to enable — see its hasCompleteSubjectFilter
   * guard), so the component renders the informational message below instead.
   */
  const logs = useAuditLogs({
    subject_type: "observation",
    subject_id: isDemo ? undefined : observation?.id,
  });

  return (
    <Modal isOpen={Boolean(observation)} onClose={onClose} className="mx-4 w-full max-w-2xl p-6">
      {observation && (
        <>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Chain of custody</h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            {observation.label ?? observation.kind} · #{observation.id.slice(0, 8)}
          </p>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {isDemo ? (
              <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                Chain of custody is unavailable for demo observations.<br />
                Real observations record every hold, bookmark, archive and access event here.
              </p>
            ) : (
              <AuditTable
                logs={logs.data?.data ?? []}
                isLoading={logs.isLoading}
                error={logs.error}
                onRetry={() => void logs.refetch()}
              />
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
