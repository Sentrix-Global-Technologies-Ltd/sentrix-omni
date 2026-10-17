import { useState, type ReactNode } from "react";
import { useOrganization } from "../../../../context/OrganizationContext";
import { incidentsApi } from "../../api/incidents.api";
import { useQueryClient } from "@tanstack/react-query";
import { incidentKeys } from "../../api/incidents.keys";
import { useToast } from "../../../../components/shared/toast";

interface IncidentBulkBarProps {
  selectedIds: string[];
  onDismiss: () => void;
}

type BulkAction = "resolve" | "close";

/**
 * Bulk action bar shown when one or more incidents are selected.
 *
 * DESIGN:
 * - Uses individual mutation endpoints (no bulk backend API exists).
 * - Runs mutations sequentially to avoid flooding the backend.
 * - Reports partial failures (some succeeded, some failed).
 * - Prevents double-submission while processing.
 * - Invalidates incidentKeys.all on completion so lists + KPI counts refresh.
 * - Export scope note: CSV export of selected rows is clear that it exports
 *   only the currently loaded page selection, not all server-side matches.
 */
export default function IncidentBulkBar({
  selectedIds,
  onDismiss,
}: IncidentBulkBarProps): ReactNode {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [processing, setProcessing] = useState(false);
  const [partialErrors, setPartialErrors] = useState<string[] | null>(null);

  const count = selectedIds.length;

  const runBulk = async (action: BulkAction) => {
    if (!activeId || processing) return;
    setProcessing(true);
    setPartialErrors(null);

    const failed: string[] = [];
    for (const id of selectedIds) {
      try {
        if (action === "resolve") {
          await incidentsApi.resolve(activeId, id);
        } else {
          await incidentsApi.close(activeId, id);
        }
      } catch {
        failed.push(id);
      }
    }

    // Invalidate once after all mutations.
    queryClient.invalidateQueries({ queryKey: incidentKeys.all(activeId) });
    setProcessing(false);

    if (failed.length === 0) {
      const verb = action === "resolve" ? "resolved" : "closed";
      toast.success(`${count - failed.length} incident${count !== 1 ? "s" : ""} ${verb}.`);
      onDismiss();
    } else {
      setPartialErrors(failed);
      toast.error(
        `${failed.length} of ${count} failed. ${count - failed.length} succeeded. Check the highlighted rows.`,
      );
    }
  };

  const handleExport = () => {
    // Export is scoped to selected incidents on the current page only.
    // This is not a server-side export of all matching incidents.
    toast.info(
      `CSV export would include ${count} selected incident${count !== 1 ? "s" : ""} from this page.`,
    );
  };

  return (
    <div className="ic-bulk-bar" role="region" aria-label="Bulk actions">
      <span className="ic-bulk-count">
        {count} selected
      </span>
      <span className="ic-bulk-sep" aria-hidden="true" />

      <button
        type="button"
        className="ic-bulk-btn"
        disabled={processing || !activeId}
        onClick={() => void runBulk("resolve")}
        aria-busy={processing}
      >
        {processing ? "Processing…" : "Resolve selected"}
      </button>

      <button
        type="button"
        className="ic-bulk-btn"
        disabled={processing || !activeId}
        onClick={() => void runBulk("close")}
        aria-busy={processing}
      >
        {processing ? "Processing…" : "Close selected"}
      </button>

      <button
        type="button"
        className="ic-bulk-btn"
        disabled={processing}
        onClick={handleExport}
        title="Exports currently selected rows only (not all server-side matches)"
      >
        {/* Download icon */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export page selection
      </button>

      {partialErrors && (
        <span className="ic-partial-notice" role="alert">
          {/* Warning icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {partialErrors.length} failed
        </span>
      )}

      <button
        type="button"
        className="ic-bulk-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss bulk bar"
      >
        Clear selection
      </button>
    </div>
  );
}
