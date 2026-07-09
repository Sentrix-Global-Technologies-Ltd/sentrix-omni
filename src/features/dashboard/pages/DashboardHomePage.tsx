import { useNavigate } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import StatCard from "../../../components/shared/StatCard";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import { AlertHexaIcon, BoltIcon, GroupIcon, TaskIcon } from "../../../icons";
import { useAuth } from "../../../context/AuthContext";
import { useOrganization } from "../../../context/OrganizationContext";

import { useIncidents } from "../../incidents/hooks/useIncidents";
import { useIncidentsRealtime } from "../../incidents/hooks/useIncidentsRealtime";
import IncidentTable from "../../incidents/components/IncidentTable";
import type { Incident } from "../../incidents/api/incidents.types";
import { useEmergencies } from "../../emergencies/hooks/useEmergencies";
import { useEmergenciesRealtime } from "../../emergencies/hooks/useEmergenciesRealtime";
import { useResponders } from "../../responders/hooks/useResponders";
import { useRespondersRealtime } from "../../responders/hooks/useRespondersRealtime";
import { useAssignments } from "../../assignments/hooks/useAssignments";
import { useAssignmentsRealtime } from "../../assignments/hooks/useAssignmentsRealtime";
import { useNotificationsRealtime } from "../../notifications/hooks/useNotificationsRealtime";

import EmergencySummaryPanel from "../components/EmergencySummaryPanel";
import DispatchQueuePanel from "../components/DispatchQueuePanel";
import ResponderAvailabilityPanel from "../components/ResponderAvailabilityPanel";
import ActivityTimelinePanel from "../components/ActivityTimelinePanel";
import EscalationPanel from "../components/EscalationPanel";
// import NotificationSummaryPanel from "../components/NotificationSummaryPanel";
import AIInsightsPlaceholder from "../components/AIInsightsPlaceholder";

interface PaginatorMeta {
  total?: number;
}

function total(meta: unknown): number | undefined {
  return (meta as PaginatorMeta | undefined)?.total;
}

/**
 * Operations Command Center — the org operator landing page. Every widget is
 * either a single-status list query (the KPI-card convention already used
 * here) or a client-side composition of data the page already fetched; no new
 * endpoints, no new realtime channels. Live via the existing per-feature
 * `use<Feature>Realtime` hooks (invalidate-on-broadcast), same as every other
 * console. Not to be confused with the platform-wide (SuperAdmin) Platform
 * Snapshot at /platform-snapshot, which is a separate, unrelated page.
 */
export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { principal } = useAuth();
  const { current } = useOrganization();

  // KPI + "active incidents" summary share this one query (same filter, same cache entry).
  const openIncidents = useIncidents({ status: "open" });
  const activeEmergencies = useEmergencies({ status: "triggered" });
  const availableResponders = useResponders({ status: "available" });
  const activeAssignments = useAssignments({ status: "active" });

  // Unfiltered recent lists feed the live activity timeline only.
  const recentIncidents = useIncidents({});
  const recentEmergencies = useEmergencies({});
  const recentAssignments = useAssignments({});

  // Keep the whole page live — one realtime hook per feature, established convention.
  const incidentsRt = useIncidentsRealtime();
  useEmergenciesRealtime();
  useRespondersRealtime();
  useAssignmentsRealtime();
  useNotificationsRealtime();

  const activeIncidents = (openIncidents.data?.data ?? []).slice(0, 5);

  return (
    <>
      <PageMeta title="Operations Command Center | Sentrix Console" description="Live operational overview" />
      <PageHeader
        title={current ? `${current.name} — Operations Command Center` : "Operations Command Center"}
        description={principal ? `Welcome back, ${principal.name}` : undefined}
        actions={<RealtimeIndicator connected={incidentsRt.connected} />}
      />

      {/* 1. Critical KPI cards */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Open incidents"
            tone="warning"
            icon={<AlertHexaIcon className="size-6" />}
            loading={openIncidents.isLoading}
            value={total(openIncidents.data?.meta) ?? 0}
            to="/incidents?status=open"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Active emergencies"
            tone="error"
            icon={<BoltIcon className="size-6" />}
            loading={activeEmergencies.isLoading}
            value={total(activeEmergencies.data?.meta) ?? 0}
            to="/emergencies?status=triggered"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Available responders"
            tone="success"
            icon={<GroupIcon className="size-6" />}
            loading={availableResponders.isLoading}
            value={total(availableResponders.data?.meta) ?? 0}
            to="/responders?status=available"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Active assignments"
            tone="info"
            icon={<TaskIcon className="size-6" />}
            loading={activeAssignments.isLoading}
            value={total(activeAssignments.data?.meta) ?? 0}
            to="/assignments?status=active"
          />
        </div>
      </div>

      {/* 2-9: operational sections. Left = primary lists, right = situational awareness. */}
      <div className="mt-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 lg:col-span-8">
          {/* 2. Active incident summary */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Active incidents</h3>
              <button
                onClick={() => navigate("/incidents?status=open")}
                className="text-theme-sm font-medium text-brand-500 hover:text-brand-600"
              >
                View all
              </button>
            </div>
            <IncidentTable
              incidents={activeIncidents}
              isLoading={openIncidents.isLoading}
              error={openIncidents.error}
              onRetry={() => void openIncidents.refetch()}
              onRowClick={(i: Incident) => navigate(`/incidents/${i.id}`)}
            />
          </div>

          {/* 3. Emergency summary */}
          <EmergencySummaryPanel />

          {/* 4. Dispatch queue */}
          <DispatchQueuePanel />

          {/* 7. Escalation panel */}
          <EscalationPanel />
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-4">
          {/* 5. Responder availability */}
          <ResponderAvailabilityPanel />

          {/* 6. Live activity timeline */}
          <ActivityTimelinePanel
            incidents={recentIncidents.data?.data ?? []}
            emergencies={recentEmergencies.data?.data ?? []}
            assignments={recentAssignments.data?.data ?? []}
          />

          {/* 8. Notification summary */}
          {/* <NotificationSummaryPanel /> */}

          {/* 9. AI Insights placeholder */}
          <AIInsightsPlaceholder />
        </div>
      </div>
    </>
  );
}
