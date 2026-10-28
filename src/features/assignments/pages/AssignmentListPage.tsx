import { useState, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import ListToolbar from "../../../components/shared/ListToolbar";
import ListPagination from "../../../components/shared/ListPagination";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";
import AssignmentFilters from "../components/AssignmentFilters";
import AssignmentTable from "../components/AssignmentTable";
import AssignmentDrawer from "../components/AssignmentDrawer";
import { useAssignments } from "../hooks/useAssignments";
import { useAssignmentActions } from "../hooks/useAssignmentActions";
import { useAssignmentsRealtime } from "../hooks/useAssignmentsRealtime";
import { useToast } from "../../../components/shared/toast";
import type { Assignment, AssignmentFilters as Filters } from "../api/assignments.types";
import "../../incidents/styles/incidents-centre.css";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

const DEFAULT_PAGE_SIZE = 25;

// ── Inline confirm component (keeps hook usage unconditional) ─────────────────

interface ConfirmActionProps {
  assignmentId: string;
  action: "complete" | "cancel";
  onClose: () => void;
}

function AssignmentActionConfirm({
  assignmentId,
  action,
  onClose,
}: ConfirmActionProps) {
  const actions = useAssignmentActions(assignmentId);
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const cfg =
    action === "complete"
      ? {
          title: "Complete assignment?",
          description: "Mark this assignment as completed.",
          confirmLabel: "Complete",
          tone: "primary" as const,
        }
      : {
          title: "Cancel assignment?",
          description:
            "Cancelling stands down this dispatch and its responders.",
          confirmLabel: "Cancel assignment",
          tone: "danger" as const,
        };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      if (action === "complete") await actions.complete.mutateAsync();
      else await actions.cancel.mutateAsync();
      toast.success("Action completed successfully.");
      onClose();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ConfirmDialog
      open
      onClose={() => (submitting ? undefined : onClose())}
      title={cfg.title}
      description={cfg.description}
      confirmLabel={cfg.confirmLabel}
      tone={cfg.tone}
      loading={submitting}
      onConfirm={handleConfirm}
    />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AssignmentListPage() {
  const [params, setParams] = useSearchParams();

  const filters: Filters = {
    status:      params.get("status")      ?? undefined,
    incident_id: params.get("incident_id") ?? undefined,
    page:        params.get("page")        ? Number(params.get("page")) : undefined,
    per_page:    params.get("per_page")    ? Number(params.get("per_page")) : DEFAULT_PAGE_SIZE,
  };

  const { connected } = useAssignmentsRealtime();
  const query = useAssignments(filters);

  const assignments = query.data?.data ?? [];
  const meta = query.data?.meta as PaginatorMeta | undefined;

  // ── Drawer state ───────────────────────────────────────────────────────────
  const [drawerId, setDrawerId] = useState<string | null>(null);

  // ── Row-level confirm action state ─────────────────────────────────────────
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    type: "complete" | "cancel";
  } | null>(null);

  // ── Client-side search over current page ───────────────────────────────────
  const [search, setSearch] = useState("");
  const visible = useMemo<Assignment[]>(() => {
    if (!search.trim()) return assignments;
    const q = search.toLowerCase();
    return assignments.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        (a.incident_id ?? "").toLowerCase().includes(q) ||
        (a.status ?? "").toLowerCase().includes(q),
    );
  }, [assignments, search]);

  // ── Filter / page helpers ──────────────────────────────────────────────────
  const updateFilters = useCallback(
    (next: Partial<Filters>) => {
      setSearch("");
      const merged = { ...filters, ...next };
      const sp = new URLSearchParams();
      if (merged.status) sp.set("status", merged.status);
      if (merged.incident_id) sp.set("incident_id", merged.incident_id);
      if (merged.per_page && merged.per_page !== DEFAULT_PAGE_SIZE)
        sp.set("per_page", String(merged.per_page));
      if (next.page !== undefined) sp.set("page", String(next.page));
      setParams(sp);
    },
    [filters, setParams],
  );

  const clearStatus = useCallback(
    () => updateFilters({ status: undefined }),
    [updateFilters],
  );

  const clearIncidentScope = useCallback(() => {
    const sp = new URLSearchParams(params);
    sp.delete("incident_id");
    setParams(sp);
  }, [params, setParams]);

  const setPage = useCallback(
    (page: number) => updateFilters({ page }),
    [updateFilters],
  );

  const setPageSize = useCallback(
    (size: number) => updateFilters({ per_page: size, page: undefined }),
    [updateFilters],
  );

  return (
    <>
      <PageMeta
        title="Assignments | Sentrix Console"
        description="Dispatch assignments"
      />
      <PageHeader
        title="Assignments"
        breadcrumbs={[{ label: "Assignments" }]}
      />

      <div className="flex flex-col gap-4 pb-6">
        {filters.incident_id && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm dark:border-brand-500/30 dark:bg-brand-500/10">
            <span className="text-brand-700 dark:text-brand-300">
              Showing assignments for incident{" "}
              <Link
                to={`/incidents/${filters.incident_id}`}
                className="font-medium underline"
              >
                {filters.incident_id.slice(0, 8)}
              </Link>
            </span>
            <button
              onClick={clearIncidentScope}
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              Clear
            </button>
          </div>
        )}

        <AssignmentFilters
          filters={filters}
          onChange={updateFilters}
          onClear={clearStatus}
        />

        <ListToolbar
          search={search}
          onSearch={setSearch}
          visibleCount={visible.length}
          totalCount={meta?.total ?? null}
          isLoading={query.isLoading}
          pageSize={filters.per_page ?? DEFAULT_PAGE_SIZE}
          onPageSizeChange={setPageSize}
          onRefresh={() => void query.refetch()}
          connected={connected}
          placeholder="Search assignments…"
          refreshLabel="Refresh assignments"
        />

        <AssignmentTable
          assignments={visible}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
          onView={(a) => setDrawerId(a.id)}
          onComplete={(a) => setConfirmAction({ id: a.id, type: "complete" })}
          onCancel={(a) => setConfirmAction({ id: a.id, type: "cancel" })}
        />

        {meta && !query.isLoading && (
          <ListPagination
            currentPage={meta.current_page ?? 1}
            lastPage={meta.last_page ?? 1}
            total={meta.total}
            from={meta.from}
            to={meta.to}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Side drawer */}
      {drawerId && (
        <AssignmentDrawer
          assignmentId={drawerId}
          onClose={() => setDrawerId(null)}
        />
      )}

      {/* Row-level confirm dialogs */}
      {confirmAction && (
        <AssignmentActionConfirm
          assignmentId={confirmAction.id}
          action={confirmAction.type}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </>
  );
}
