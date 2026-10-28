import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import ListToolbar from "../../../components/shared/ListToolbar";
import ListPagination from "../../../components/shared/ListPagination";
import Can from "../../../components/shared/Can";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";
import EmergencyFilters from "../components/EmergencyFilters";
import EmergencyTable from "../components/EmergencyTable";
import EmergencyDrawer from "../components/EmergencyDrawer";
import { useEmergencies } from "../hooks/useEmergencies";
import { useEmergenciesRealtime } from "../hooks/useEmergenciesRealtime";
import { useEmergencyActions } from "../hooks/useEmergencyActions";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import type { Emergency, EmergencyFilters as Filters } from "../api/emergencies.types";

// Shared Incidents Centre CSS — provides ic-filter-*, ic-drawer-*, ic-row-menu-* etc.
import "../../incidents/styles/incidents-centre.css";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

const DEFAULT_PAGE_SIZE = 25;

type ActionKey = "acknowledge" | "resolve" | "cancel";

interface ConfirmState {
  emergency: Emergency;
  action: ActionKey;
}

export default function EmergencyListPage() {
  const [params, setParams] = useSearchParams();

  const filters: Filters = {
    status:   params.get("status")   ?? undefined,
    severity: params.get("severity") ?? undefined,
    page:     params.get("page")     ? Number(params.get("page")) : undefined,
    per_page: params.get("per_page") ? Number(params.get("per_page")) : DEFAULT_PAGE_SIZE,
  };

  const { connected } = useEmergenciesRealtime();
  const query = useEmergencies(filters);
  const toast = useToast();

  const emergencies = query.data?.data ?? [];
  const meta = query.data?.meta as PaginatorMeta | undefined;

  // ── Drawer state ──────────────────────────────────────────────────────────
  const [drawerEmergencyId, setDrawerEmergencyId] = useState<string | null>(null);

  // ── Confirm-action state ──────────────────────────────────────────────────
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resolution, setResolution] = useState("");

  // Hook is keyed by id — we only create mutations when confirmState is set
  const emergencyActions = useEmergencyActions(confirmState?.emergency.id ?? "");

  // ── Client-side search over current page ─────────────────────────────────
  const [search, setSearch] = useState("");
  const visible = useMemo<Emergency[]>(() => {
    if (!search.trim()) return emergencies;
    const q = search.toLowerCase();
    return emergencies.filter(
      (e) =>
        e.message?.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.status?.toLowerCase().includes(q),
    );
  }, [emergencies, search]);

  // ── Filter / page helpers ────────────────────────────────────────────────
  const updateFilters = useCallback((next: Partial<Filters>) => {
    setSearch("");
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.status)   sp.set("status",   merged.status);
    if (merged.severity) sp.set("severity", merged.severity);
    if (merged.per_page && merged.per_page !== DEFAULT_PAGE_SIZE)
      sp.set("per_page", String(merged.per_page));
    if (next.page !== undefined) sp.set("page", String(next.page));
    setParams(sp);
  }, [filters, setParams]);

  const clear = useCallback(() => { setSearch(""); setParams(new URLSearchParams()); }, [setParams]);

  const setPage     = useCallback((page: number) => updateFilters({ page }), [updateFilters]);
  const setPageSize = useCallback(
    (size: number) => updateFilters({ per_page: size, page: undefined }),
    [updateFilters],
  );

  // ── Action callbacks (from table row menu) ───────────────────────────────
  const handleView = useCallback((e: Emergency) => {
    setDrawerEmergencyId(e.id);
  }, []);

  const handleAction = useCallback((e: Emergency, action: ActionKey) => {
    setResolution("");
    setConfirmState({ emergency: e, action });
  }, []);

  const handleConfirm = async () => {
    if (!confirmState) return;
    setSubmitting(true);
    try {
      if (confirmState.action === "acknowledge") {
        await emergencyActions.acknowledge.mutateAsync();
        toast.success("Emergency acknowledged");
      } else if (confirmState.action === "resolve") {
        await emergencyActions.resolve.mutateAsync(resolution || undefined);
        toast.success("Emergency resolved");
      } else if (confirmState.action === "cancel") {
        await emergencyActions.cancel.mutateAsync();
        toast.success("Emergency cancelled");
      }
      setConfirmState(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Confirm dialog config by action ──────────────────────────────────────
  const confirmConfig: Record<ActionKey, { title: string; description: string; confirmLabel: string; tone: "primary" | "danger" }> = {
    acknowledge: {
      title: "Acknowledge emergency?",
      description: "Confirm you are coordinating a response to this emergency.",
      confirmLabel: "Acknowledge",
      tone: "primary",
    },
    resolve: {
      title: "Resolve emergency?",
      description: "Mark this emergency resolved. You may add a resolution note.",
      confirmLabel: "Resolve",
      tone: "primary",
    },
    cancel: {
      title: "Cancel emergency?",
      description: "Stand this emergency down as a false alarm or duplicate.",
      confirmLabel: "Cancel emergency",
      tone: "danger",
    },
  };

  const cfg = confirmState ? confirmConfig[confirmState.action] : null;

  return (
    <>
      <PageMeta title="Emergencies | Sentrix Console" description="Emergency coordination" />
      <PageHeader
        title="Emergencies"
        breadcrumbs={[{ label: "Emergencies" }]}
      />

      <div className="flex flex-col gap-4 pb-6">
        <EmergencyFilters filters={filters} onChange={updateFilters} onClear={clear} />

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
          placeholder="Search emergencies…"
          refreshLabel="Refresh emergencies"
        />

        <EmergencyTable
          emergencies={visible}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
          onRowClick={handleView}
          onView={handleView}
          onAction={handleAction}
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

      {/* ── Emergency detail drawer ─────────────────────────────────────── */}
      {drawerEmergencyId && (
        <EmergencyDrawer
          emergencyId={drawerEmergencyId}
          onClose={() => setDrawerEmergencyId(null)}
        />
      )}

      {/* ── Action confirmation dialogs ─────────────────────────────────── */}
      {cfg && confirmState && (
        <Can
          permission={
            confirmState.action === "acknowledge" ? "emergencies.acknowledge"
            : confirmState.action === "resolve"   ? "emergencies.resolve"
            : "emergencies.resolve"  /* cancel also uses resolve permission */
          }
          fallback={
            <ConfirmDialog
              open={!!confirmState}
              onClose={() => setConfirmState(null)}
              title="Permission denied"
              description="You do not have permission to perform this action."
              confirmLabel="OK"
              onConfirm={() => setConfirmState(null)}
            />
          }
        >
          <ConfirmDialog
            open={!!confirmState}
            onClose={() => submitting ? undefined : setConfirmState(null)}
            title={cfg.title}
            description={cfg.description}
            confirmLabel={cfg.confirmLabel}
            tone={cfg.tone}
            loading={submitting}
            onConfirm={handleConfirm}
          >
            {confirmState.action === "resolve" && (
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Resolution note (optional)"
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
              />
            )}
          </ConfirmDialog>
        </Can>
      )}
    </>
  );
}
