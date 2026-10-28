import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg, EventClickArg, EventInput } from "@fullcalendar/core";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import LoadingState from "../../../components/ui/state/LoadingState";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import { useRosterCertifications, useRosterResponders, useRosterShifts } from "../hooks/useRoster";
import ScheduleShiftButton from "../components/ScheduleShiftButton";
import ShiftDetailModal from "../components/ShiftDetailModal";
import { responderLabel } from "../../responders/components/responderTone";
import { useRespondersRealtime } from "../../responders/hooks/useRespondersRealtime";
import "../../incidents/styles/incidents-centre.css";
import type { Responder } from "../../responders/api/responders.types";
import type { DutyShift } from "../../responders/api/profile.types";

type RosterEntry = { shift: DutyShift; responder: Responder };

const SHIFT_CALENDAR_CLASS: Record<string, string> = {
  scheduled: "Primary",
  active: "Success",
  completed: "Warning",
  cancelled: "Danger",
};

function renderEventContent(eventInfo: EventContentArg) {
  const colorClass = `fc-bg-${String(eventInfo.event.extendedProps.calendar).toLowerCase()}`;
  return (
    <div className={`event-fc-color flex fc-event-main ${colorClass} rounded-sm p-1`}>
      <div className="fc-daygrid-event-dot" />
      {eventInfo.timeText && <div className="fc-event-time">{eventInfo.timeText}</div>}
      <div className="fc-event-title truncate">{eventInfo.event.title}</div>
    </div>
  );
}

/**
 * Org-wide duty roster. Replaces the unused template Calendar (`/calendar`,
 * never wired to real data and not in the nav) with a real one built on the
 * already-installed FullCalendar and the aggregate `duty-shifts` endpoint
 * (see hooks/useRoster.ts). Certifications still fan out one request per
 * responder — no org-wide certifications endpoint exists yet.
 */
export default function RosterPage() {
  const responders = useRosterResponders();
  const allResponders = useMemo(() => responders.data?.data ?? [], [responders.data]);
  const { shifts, isLoading: shiftsLoading } = useRosterShifts(allResponders);
  const { certifications, isLoading: certsLoading } = useRosterCertifications(allResponders);
  const [selected, setSelected] = useState<RosterEntry | null>(null);
  const { connected } = useRespondersRealtime();

  const onDutyNow = allResponders.filter((r) => r.status === "engaged" || r.status === "available").length;

  const now = Date.now();
  const weekAhead = now + 7 * 24 * 60 * 60 * 1000;
  const shiftsThisWeek = shifts.filter(({ shift }) => {
    const t = shift.starts_at ? new Date(shift.starts_at).getTime() : 0;
    return t >= now && t <= weekAhead;
  }).length;

  const thirtyDaysAhead = now + 30 * 24 * 60 * 60 * 1000;
  const expiringCerts = certifications.filter(({ cert }) => {
    if (!cert.expires_at) return false;
    const t = new Date(cert.expires_at).getTime();
    return t >= now && t <= thirtyDaysAhead;
  }).length;

  const events: EventInput[] = shifts.map(({ shift, responder }) => ({
    id: shift.id,
    title: responderLabel(responder),
    start: shift.starts_at ?? undefined,
    end: shift.ends_at ?? undefined,
    extendedProps: { calendar: SHIFT_CALENDAR_CLASS[shift.status] ?? "Primary", shift, responder },
  }));

  const handleEventClick = (info: EventClickArg) => {
    const { shift, responder } = info.event.extendedProps as { shift: DutyShift; responder: Responder };
    setSelected({ shift, responder });
  };

  const isLoading = responders.isLoading || shiftsLoading || certsLoading;

  return (
    <>
      <PageMeta title="Roster | Sentrix Console" description="Duty shift scheduling" />
      <PageHeader
        title="Roster"
        breadcrumbs={[{ label: "Roster" }]}
        actions={
          <>
            <RealtimeIndicator connected={connected} />
            <ScheduleShiftButton responders={allResponders} />
          </>
        }
      />

      <div className="ic-kpi-grid">
        {/* On duty now */}
        <div className="ic-stat-card">
          <div className="ic-stat-label">On duty now</div>
          <div className="ic-stat-value">
            {responders.isLoading
              ? <span className="ic-stat-skeleton" aria-label="Loading…" />
              : onDutyNow.toLocaleString()}
          </div>
          <div className="ic-stat-sub">Active responders</div>
          <div className="ic-stat-accent ic-stat-accent--success" />
        </div>

        {/* Shifts this week */}
        <div className="ic-stat-card">
          <div className="ic-stat-label">Shifts this week</div>
          <div className="ic-stat-value">
            {shiftsLoading
              ? <span className="ic-stat-skeleton" aria-label="Loading…" />
              : shiftsThisWeek.toLocaleString()}
          </div>
          <div className="ic-stat-sub">Next 7 days</div>
          <div className="ic-stat-accent ic-stat-accent--info" />
        </div>

        {/* Certifications expiring */}
        <div className="ic-stat-card">
          <div className="ic-stat-label">Certifications expiring (30d)</div>
          <div className="ic-stat-value">
            {certsLoading
              ? <span className="ic-stat-skeleton" aria-label="Loading…" />
              : expiringCerts.toLocaleString()}
          </div>
          <div className="ic-stat-sub">Needs renewal</div>
          <div className="ic-stat-accent ic-stat-accent--warning" />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          {isLoading && allResponders.length === 0 ? (
            <LoadingState />
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              height="auto"
            />
          )}
        </div>
      </div>

      <ShiftDetailModal entry={selected} onClose={() => setSelected(null)} />
    </>
  );
}
