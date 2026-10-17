import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Can from "../../../components/shared/Can";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";
import CreateIncidentButton from "../components/CreateIncidentButton";
import { useIncidents } from "../hooks/useIncidents";
import { useIncidentsRealtime } from "../hooks/useIncidentsRealtime";
import { useIncidentKpis } from "../hooks/useIncidentKpis";
import { useIncidentActions } from "../hooks/useIncidentActions";
import IncidentKpiCards from "../components/centre/IncidentKpiCards";
import IncidentCentreFilters from "../components/centre/IncidentCentreFilters";
import IncidentSearchToolbar from "../components/centre/IncidentSearchToolbar";
import IncidentBulkBar from "../components/centre/IncidentBulkBar";
import IncidentDenseTable from "../components/centre/IncidentDenseTable";
import IncidentInlinePagination from "../components/centre/IncidentInlinePagination";
import IncidentDrawer from "../components/centre/IncidentDrawer";
import type { Incident, IncidentCentreFilters as FiltersShape } from "../api/incidents.types";

import "../styles/incidents-centre.css";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

/** Default page size for the incidents list. */
const DEFAULT_PAGE_SIZE = 25;

/**
 * Incidents Centre — the operational incidents list page.
 *
 * Replaces the old IncidentListPage with a dense, actionable console:
 *   - 5 KPI cards (live counts via parallel per_page=1 queries)
 *   - Filter row (severity + status supported; type/site/responder clearly unavailable)
 *   - Search toolbar (client-side filter over current page — labelled as such)
 *   - Bulk action bar (resolve / close via individual API calls)
 *   - Dense incidents table with checkbox multi-select + three-dot row menu
 *   - Inline pagination
 *   - Slide-in detail drawer with evidence, timeline, workflow actions
 *
 * Preserved: IncidentDetailPage at /incidents/:id, routing, realtime, permissions.
 */
export default function IncidentListPage() {
  const [params, setParams] = useSearchParams();

  // ── URL-driven filters (status, severity, page, per_page) ──────────────────
  const filters: FiltersShape = {
    status:   params.get("status")   ?? undefined,
    severity: params.get("severity") ?? undefined,
    page:     params.get("page")     ? Number(params.get("page")) : undefined,
    per_page: params.get("per_page") ? Number(params.get("per_page")) : DEFAULT_PAGE_SIZE,
  };

  // ── Realtime + list query ─────────────────────────────────────────────────
  const { connected } = useIncidentsRealtime();
  const query = useIncidents(filters);

  const incidents = query.data?.data ?? [];
  const meta = query.data?.meta as PaginatorMeta | undefined;

  // ── KPI counts ─────────────────────────────────────────────────────────────
  const kpis = useIncidentKpis();

  // ── Client-side search over current page ───────────────────────────────────
  const [search, setSearch] = useState("");
  const visibleIncidents = useMemo<Incident[]>(() => {
    if (!search.trim()) return incidents;
    const q = search.toLowerCase();
    return incidents.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        (i.summary ?? "").toLowerCase().includes(q),
    );
  }, [incidents, search]);

  // ── Multi-select ───────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const toggleAll = useCallback((all: boolean) => {
    setSelectedIds(all ? new Set(incidents.map((i) => i.id)) : new Set());
  }, [incidents]);
  const dismissBulk = useCallback(() => setSelectedIds(new Set()), []);

  // ── Row-level action confirm state ─────────────────────────────────────────
  // The three-dot row menu sets a pending action; a ConfirmDialog at the page
  // level handles confirmation cleanly without nesting inside the table.
  const [pendingAction, setPendingAction] = useState<{
    incident: Incident;
    action: "investigate" | "escalate" | "resolve" | "close";
  } | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const rowActions = useIncidentActions(pendingAction?.incident.id ?? "");

  const handleRowAction = useCallback(
    (incident: Incident, action: "investigate" | "escalate" | "resolve" | "close") => {
      setPendingAction({ incident, action });
    },
    [],
  );

  const ACTION_CONFIGS = {
    investigate: { title: "Mark as Investigating", description: "Confirm that this incident is under active investigation.", confirmLabel: "Mark investigating", tone: "primary" as const },
    escalate:    { title: "Escalate Incident",     description: "Escalate this incident to a higher level of urgency.",    confirmLabel: "Escalate",          tone: "danger"  as const },
    resolve:     { title: "Resolve Incident",       description: "Mark this incident as resolved.",                        confirmLabel: "Resolve",           tone: "primary" as const },
    close:       { title: "Close Incident",         description: "Close this incident and remove it from active queues.",  confirmLabel: "Close incident",    tone: "danger"  as const },
  } as const;

  const actionConfig = pendingAction ? ACTION_CONFIGS[pendingAction.action] : null;

  const executeRowAction = useCallback(async () => {
    if (!pendingAction) return;
    setActionSubmitting(true);
    try {
      const { action } = pendingAction;
      if (action === "investigate") await rowActions.investigate.mutateAsync();
      else if (action === "escalate") await rowActions.escalate.mutateAsync();
      else if (action === "resolve")  await rowActions.resolve.mutateAsync();
      else if (action === "close")    await rowActions.close.mutateAsync();
      setPendingAction(null);
    } finally {
      setActionSubmitting(false);
    }
  }, [pendingAction, rowActions]);

  // ── Page size changes reset to page 1 ─────────────────────────────────────
  const updateFilters = useCallback((next: Partial<FiltersShape>) => {
    setSelectedIds(new Set());
    setSearch("");
    const sp = new URLSearchParams();
    const merged = { ...filters, ...next };
    if (merged.status)   sp.set("status",   merged.status);
    if (merged.severity) sp.set("severity", merged.severity);
    if (merged.per_page && merged.per_page !== DEFAULT_PAGE_SIZE)
      sp.set("per_page", String(merged.per_page));
    // page is reset when filters change; preserved only when next.page is set
    if (next.page !== undefined) sp.set("page", String(next.page));
    setParams(sp);
  }, [filters, setParams]);

  const clearFilters = useCallback(() => {
    setSelectedIds(new Set());
    setSearch("");
    setParams(new URLSearchParams());
  }, [setParams]);

  const setPage = useCallback((page: number) => {
    setSelectedIds(new Set());
    updateFilters({ page });
  }, [updateFilters]);

  const setPageSize = useCallback((size: number) => {
    updateFilters({ per_page: size, page: undefined });
  }, [updateFilters]);

  // ── Drawer ─────────────────────────────────────────────────────────────────
  const [drawerIncidentId, setDrawerIncidentId] = useState<string | null>(null);
  const openDrawer = useCallback((incident: Incident) => setDrawerIncidentId(incident.id), []);
  const closeDrawer = useCallback(() => setDrawerIncidentId(null), []);

  return (
    <>
      <PageMeta title="Incidents Centre | Sentrix Console" description="Operational incidents console" />
      <PageHeader
        title="Incidents Centre"
        breadcrumbs={[{ label: "Incidents" }]}
        actions={
          <div className="flex items-center gap-2">
            <Can permission="incidents.create">
              <CreateIncidentButton />
            </Can>
          </div>
        }
      />

      <div className="ic-page">
        {/* KPI cards */}
        <IncidentKpiCards
          total={kpis.total}
          open={kpis.open}
          escalated={kpis.escalated}
          critical={kpis.critical}
          resolved={kpis.resolved}
        />

        {/* Filter row */}
        <IncidentCentreFilters
          filters={filters}
          onChange={updateFilters}
          onClear={clearFilters}
        />

        {/* Search + meta toolbar */}
        <IncidentSearchToolbar
          search={search}
          onSearch={setSearch}
          visibleCount={visibleIncidents.length}
          totalCount={meta?.total ?? null}
          isLoading={query.isLoading}
          pageSize={filters.per_page ?? DEFAULT_PAGE_SIZE}
          onPageSizeChange={setPageSize}
          onRefresh={() => void query.refetch()}
          connected={connected}
        />

        {/* Bulk bar */}
        {selectedIds.size > 0 && (
          <IncidentBulkBar
            selectedIds={Array.from(selectedIds)}
            onDismiss={dismissBulk}
          />
        )}

        {/* Dense table */}
        <IncidentDenseTable
          incidents={visibleIncidents}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          onRowClick={openDrawer}
          onRowAction={handleRowAction}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        />

        {/* Inline pagination */}
        {meta && !query.isLoading && (
          <IncidentInlinePagination
            currentPage={meta.current_page ?? 1}
            lastPage={meta.last_page ?? 1}
            total={meta.total}
            from={meta.from}
            to={meta.to}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Row-level confirmed action dialog (triggered from three-dot menu) */}
      <Can permission="incidents.update">
        <ConfirmDialog
          open={Boolean(pendingAction && actionConfig)}
          onClose={() => setPendingAction(null)}
          title={actionConfig?.title ?? ""}
          description={actionConfig?.description}
          confirmLabel={actionConfig?.confirmLabel}
          tone={actionConfig?.tone}
          loading={actionSubmitting}
          onConfirm={() => void executeRowAction()}
        />
      </Can>

      {/* Detail drawer */}
      {drawerIncidentId && (
        <IncidentDrawer
          incidentId={drawerIncidentId}
          onClose={closeDrawer}
        />
      )}
    </>
  );
}
