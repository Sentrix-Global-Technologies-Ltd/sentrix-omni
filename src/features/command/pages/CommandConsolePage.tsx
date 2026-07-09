import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import StatCard from "../../../components/shared/StatCard";
import Tabs from "../../../components/shared/Tabs";
import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import Button from "../../../components/ui/button/Button";
import Pagination from "../../../components/ui/pagination/Pagination";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import { AlertHexaIcon, ErrorHexaIcon, MapPinIcon, TimeIcon } from "../../../icons";
import CommandIncidentTable from "../components/CommandIncidentTable";
import AgencyTable from "../components/AgencyTable";
import CommandNodeTable from "../components/CommandNodeTable";
import OrganizationOversightTable from "../components/OrganizationOversightTable";
import RouteIncidentButton from "../components/RouteIncidentButton";
import CreateAgencyButton from "../components/CreateAgencyButton";
import CreateCommandButton from "../components/CreateCommandButton";
import {
  AGENCY_STATUS_OPTIONS,
  CATEGORY_OPTIONS,
  CMD_STATUS_OPTIONS,
  SEVERITY_OPTIONS,
  TIER_OPTIONS,
} from "../components/commandTone";
import {
  useAgencies,
  useCommandIncidents,
  useCommandNodes,
  useCommandOverview,
  useOrganizationsOversight,
} from "../hooks/useCommand";
import { useCommandRealtime } from "../hooks/useCommandRealtime";
import MutualAidTable from "../../coordination/components/MutualAidTable";
import RequestAidButton from "../../coordination/components/RequestAidButton";
import TaskingTable from "../../coordination/components/TaskingTable";
import RouteTaskingButton from "../../coordination/components/RouteTaskingButton";
import DutyBookTable from "../../coordination/components/DutyBookTable";
import RecordDutyButton from "../../coordination/components/RecordDutyButton";
import UnitCommsPanel from "../../coordination/components/UnitCommsPanel";
import AnalyticsPanel from "../../coordination/components/AnalyticsPanel";
import {
  DUTY_SCOPE_OPTIONS,
  MUTUAL_AID_STATUS_OPTIONS,
  TASKING_KIND_OPTIONS,
  TASKING_STATUS_OPTIONS,
} from "../../coordination/components/coordinationTone";
import { useDutyEntries, useMutualAid, useTaskings } from "../../coordination/hooks/useCoordination";
import { useCoordinationRealtime } from "../../coordination/hooks/useCoordinationRealtime";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

export default function CommandConsolePage() {
  const [tab, setTab] = useState("incidents");

  // Incidents tab filters.
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [incidentPage, setIncidentPage] = useState(1);

  // Agencies / commands tab filters.
  const [agencyStatus, setAgencyStatus] = useState("");
  const [agencyPage, setAgencyPage] = useState(1);
  const [tier, setTier] = useState("");
  const [commandPage, setCommandPage] = useState(1);

  // Organizations (agency oversight) tab filter.
  const [oversightAgencyId, setOversightAgencyId] = useState("");
  const [oversightPage, setOversightPage] = useState(1);

  // Mutual aid / taskings / duty book tab filters (Coordination domain).
  const [aidStatus, setAidStatus] = useState("");
  const [aidPage, setAidPage] = useState(1);
  const [taskingStatus, setTaskingStatus] = useState("");
  const [taskingKind, setTaskingKind] = useState("");
  const [taskingPage, setTaskingPage] = useState(1);
  const [dutyScope, setDutyScope] = useState("");
  const [dutyPage, setDutyPage] = useState(1);

  const overview = useCommandOverview();
  const incidents = useCommandIncidents({
    status: status || undefined,
    severity: severity || undefined,
    category: category || undefined,
    page: incidentPage,
  });
  const agencies = useAgencies({ status: agencyStatus || undefined, page: agencyPage });
  const commands = useCommandNodes({ tier: tier || undefined, page: commandPage });
  const oversight = useOrganizationsOversight({
    agency_id: oversightAgencyId || undefined,
    page: oversightPage,
  });
  const mutualAid = useMutualAid({ status: aidStatus || undefined, page: aidPage });
  const taskings = useTaskings({
    status: taskingStatus || undefined,
    kind: taskingKind || undefined,
    page: taskingPage,
  });
  const dutyEntries = useDutyEntries({ scope_type: dutyScope || undefined, page: dutyPage });
  const { connected } = useCommandRealtime();
  // Coordination shares the same platform channel; a second subscription is
  // safe (reference-counted) and keeps each feature's realtime hook self-contained.
  useCoordinationRealtime();

  const o = overview.data?.data;
  const incidentsMeta = incidents.data?.meta as PaginatorMeta | undefined;
  const agenciesMeta = agencies.data?.meta as PaginatorMeta | undefined;
  const commandsMeta = commands.data?.meta as PaginatorMeta | undefined;
  const oversightMeta = oversight.data?.meta as PaginatorMeta | undefined;
  const agencyOptions = (agencies.data?.data ?? []).map((a) => ({ value: a.id, label: a.name }));
  const mutualAidMeta = mutualAid.data?.meta as PaginatorMeta | undefined;
  const taskingsMeta = taskings.data?.meta as PaginatorMeta | undefined;
  const dutyMeta = dutyEntries.data?.meta as PaginatorMeta | undefined;
  const incidentsFiltered = Boolean(status || severity || category);

  return (
    <>
      <PageMeta title="Command & CAD | Sentrix Console" description="Agency command and dispatch" />
      <PageHeader
        title="Command & CAD"
        breadcrumbs={[{ label: "SuperAdmin", to: "/superadmin" }, { label: "Command & CAD" }]}
        actions={
          <div className="flex items-center gap-2">
            <RealtimeIndicator connected={connected} />
            {tab === "agencies" ? (
              <CreateAgencyButton />
            ) : tab === "commands" ? (
              <CreateCommandButton />
            ) : tab === "mutual-aid" ? (
              <RequestAidButton />
            ) : tab === "taskings" ? (
              <RouteTaskingButton />
            ) : tab === "duty" ? (
              <RecordDutyButton />
            ) : tab === "unit-comms" || tab === "analytics" || tab === "organizations" ? null : (
              <RouteIncidentButton />
            )}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Open incidents"
            tone="warning"
            icon={<AlertHexaIcon className="size-6" />}
            loading={overview.isLoading}
            value={o?.open ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Critical"
            tone="error"
            icon={<ErrorHexaIcon className="size-6" />}
            loading={overview.isLoading}
            value={o?.critical ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="On scene"
            tone="info"
            icon={<MapPinIcon className="size-6" />}
            loading={overview.isLoading}
            value={o?.on_scene ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Last 24h"
            tone="primary"
            icon={<TimeIcon className="size-6" />}
            loading={overview.isLoading}
            value={o?.last_24h ?? 0}
          />
        </div>
      </div>

      <Tabs
        tabs={[
          { key: "incidents", label: "Incidents" },
          { key: "agencies", label: "Agencies" },
          { key: "commands", label: "Commands" },
          { key: "organizations", label: "Organizations" },
          { key: "mutual-aid", label: "Mutual Aid" },
          { key: "unit-comms", label: "Unit Comms" },
          { key: "taskings", label: "Taskings" },
          { key: "duty", label: "Duty Book" },
          { key: "analytics", label: "Analytics" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "incidents" && (
        <>
          <FilterBar
            trailing={
              incidentsFiltered ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStatus("");
                    setSeverity("");
                    setCategory("");
                    setIncidentPage(1);
                  }}
                >
                  Clear
                </Button>
              ) : undefined
            }
          >
            <FilterSelect
              label="Status"
              value={status}
              options={CMD_STATUS_OPTIONS}
              placeholder="All statuses"
              onChange={(v) => { setStatus(v); setIncidentPage(1); }}
            />
            <FilterSelect
              label="Severity"
              value={severity}
              options={SEVERITY_OPTIONS}
              placeholder="All"
              onChange={(v) => { setSeverity(v); setIncidentPage(1); }}
            />
            <FilterSelect
              label="Category"
              value={category}
              options={CATEGORY_OPTIONS}
              placeholder="All"
              onChange={(v) => { setCategory(v); setIncidentPage(1); }}
            />
          </FilterBar>

          <CommandIncidentTable
            incidents={incidents.data?.data ?? []}
            isLoading={incidents.isLoading}
            error={incidents.error}
            onRetry={() => void incidents.refetch()}
          />

          {incidentsMeta && (
            <Pagination
              currentPage={incidentsMeta.current_page ?? 1}
              lastPage={incidentsMeta.last_page ?? 1}
              total={incidentsMeta.total}
              from={incidentsMeta.from}
              to={incidentsMeta.to}
              onPageChange={setIncidentPage}
            />
          )}
        </>
      )}

      {tab === "agencies" && (
        <>
          <FilterBar
            trailing={
              agencyStatus ? (
                <Button size="sm" variant="outline" onClick={() => { setAgencyStatus(""); setAgencyPage(1); }}>
                  Clear
                </Button>
              ) : undefined
            }
          >
            <FilterSelect
              label="Status"
              value={agencyStatus}
              options={AGENCY_STATUS_OPTIONS}
              placeholder="All statuses"
              onChange={(v) => { setAgencyStatus(v); setAgencyPage(1); }}
            />
          </FilterBar>

          <AgencyTable
            agencies={agencies.data?.data ?? []}
            isLoading={agencies.isLoading}
            error={agencies.error}
            onRetry={() => void agencies.refetch()}
          />

          {agenciesMeta && (
            <Pagination
              currentPage={agenciesMeta.current_page ?? 1}
              lastPage={agenciesMeta.last_page ?? 1}
              total={agenciesMeta.total}
              from={agenciesMeta.from}
              to={agenciesMeta.to}
              onPageChange={setAgencyPage}
            />
          )}
        </>
      )}

      {tab === "commands" && (
        <>
          <FilterBar
            trailing={
              tier ? (
                <Button size="sm" variant="outline" onClick={() => { setTier(""); setCommandPage(1); }}>
                  Clear
                </Button>
              ) : undefined
            }
          >
            <FilterSelect
              label="Tier"
              value={tier}
              options={TIER_OPTIONS}
              placeholder="All tiers"
              onChange={(v) => { setTier(v); setCommandPage(1); }}
            />
          </FilterBar>

          <CommandNodeTable
            commands={commands.data?.data ?? []}
            isLoading={commands.isLoading}
            error={commands.error}
            onRetry={() => void commands.refetch()}
          />

          {commandsMeta && (
            <Pagination
              currentPage={commandsMeta.current_page ?? 1}
              lastPage={commandsMeta.last_page ?? 1}
              total={commandsMeta.total}
              from={commandsMeta.from}
              to={commandsMeta.to}
              onPageChange={setCommandPage}
            />
          )}
        </>
      )}

      {tab === "organizations" && (
        <>
          <FilterBar
            trailing={
              oversightAgencyId ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setOversightAgencyId(""); setOversightPage(1); }}
                >
                  Clear
                </Button>
              ) : undefined
            }
          >
            <FilterSelect
              label="Agency"
              value={oversightAgencyId}
              options={agencyOptions}
              placeholder="All agencies"
              onChange={(v) => { setOversightAgencyId(v); setOversightPage(1); }}
            />
          </FilterBar>

          <OrganizationOversightTable
            organizations={oversight.data?.data ?? []}
            isLoading={oversight.isLoading}
            error={oversight.error}
            onRetry={() => void oversight.refetch()}
          />

          {oversightMeta && (
            <Pagination
              currentPage={oversightMeta.current_page ?? 1}
              lastPage={oversightMeta.last_page ?? 1}
              total={oversightMeta.total}
              from={oversightMeta.from}
              to={oversightMeta.to}
              onPageChange={setOversightPage}
            />
          )}
        </>
      )}

      {tab === "mutual-aid" && (
        <>
          <FilterBar
            trailing={
              aidStatus ? (
                <Button size="sm" variant="outline" onClick={() => { setAidStatus(""); setAidPage(1); }}>
                  Clear
                </Button>
              ) : undefined
            }
          >
            <FilterSelect
              label="Status"
              value={aidStatus}
              options={MUTUAL_AID_STATUS_OPTIONS}
              placeholder="All statuses"
              onChange={(v) => { setAidStatus(v); setAidPage(1); }}
            />
          </FilterBar>

          <MutualAidTable
            requests={mutualAid.data?.data ?? []}
            isLoading={mutualAid.isLoading}
            error={mutualAid.error}
            onRetry={() => void mutualAid.refetch()}
          />

          {mutualAidMeta && (
            <Pagination
              currentPage={mutualAidMeta.current_page ?? 1}
              lastPage={mutualAidMeta.last_page ?? 1}
              total={mutualAidMeta.total}
              from={mutualAidMeta.from}
              to={mutualAidMeta.to}
              onPageChange={setAidPage}
            />
          )}
        </>
      )}

      {tab === "unit-comms" && <UnitCommsPanel />}

      {tab === "taskings" && (
        <>
          <FilterBar
            trailing={
              taskingStatus || taskingKind ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTaskingStatus("");
                    setTaskingKind("");
                    setTaskingPage(1);
                  }}
                >
                  Clear
                </Button>
              ) : undefined
            }
          >
            <FilterSelect
              label="Status"
              value={taskingStatus}
              options={TASKING_STATUS_OPTIONS}
              placeholder="All statuses"
              onChange={(v) => { setTaskingStatus(v); setTaskingPage(1); }}
            />
            <FilterSelect
              label="Kind"
              value={taskingKind}
              options={TASKING_KIND_OPTIONS}
              placeholder="All kinds"
              onChange={(v) => { setTaskingKind(v); setTaskingPage(1); }}
            />
          </FilterBar>

          <TaskingTable
            taskings={taskings.data?.data ?? []}
            isLoading={taskings.isLoading}
            error={taskings.error}
            onRetry={() => void taskings.refetch()}
          />

          {taskingsMeta && (
            <Pagination
              currentPage={taskingsMeta.current_page ?? 1}
              lastPage={taskingsMeta.last_page ?? 1}
              total={taskingsMeta.total}
              from={taskingsMeta.from}
              to={taskingsMeta.to}
              onPageChange={setTaskingPage}
            />
          )}
        </>
      )}

      {tab === "duty" && (
        <>
          <FilterBar
            trailing={
              dutyScope ? (
                <Button size="sm" variant="outline" onClick={() => { setDutyScope(""); setDutyPage(1); }}>
                  Clear
                </Button>
              ) : undefined
            }
          >
            <FilterSelect
              label="Scope"
              value={dutyScope}
              options={DUTY_SCOPE_OPTIONS}
              placeholder="All scopes"
              onChange={(v) => { setDutyScope(v); setDutyPage(1); }}
            />
          </FilterBar>

          <DutyBookTable
            entries={dutyEntries.data?.data ?? []}
            isLoading={dutyEntries.isLoading}
            error={dutyEntries.error}
            onRetry={() => void dutyEntries.refetch()}
          />

          {dutyMeta && (
            <Pagination
              currentPage={dutyMeta.current_page ?? 1}
              lastPage={dutyMeta.last_page ?? 1}
              total={dutyMeta.total}
              from={dutyMeta.from}
              to={dutyMeta.to}
              onPageChange={setDutyPage}
            />
          )}
        </>
      )}

      {tab === "analytics" && <AnalyticsPanel />}
    </>
  );
}
