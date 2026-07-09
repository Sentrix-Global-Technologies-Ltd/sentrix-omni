import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg, EventClickArg, EventInput } from "@fullcalendar/core";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import StatCard from "../../../components/shared/StatCard";
import LoadingState from "../../../components/ui/state/LoadingState";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import { AlertIcon, CalenderIcon, GroupIcon } from "../../../icons";
import { useRosterCertifications, useRosterResponders, useRosterShifts } from "../hooks/useRoster";
import ScheduleShiftButton from "../components/ScheduleShiftButton";
import ShiftDetailModal from "../components/ShiftDetailModal";
import { responderLabel } from "../../responders/components/responderTone";
import { useRespondersRealtime } from "../../responders/hooks/useRespondersRealtime";
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

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            label="On duty now"
            tone="success"
            icon={<GroupIcon className="size-6" />}
            loading={responders.isLoading}
            value={onDutyNow}
            to="/responders?status=available"
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            label="Shifts this week"
            tone="info"
            icon={<CalenderIcon className="size-6" />}
            loading={shiftsLoading}
            value={shiftsThisWeek}
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            label="Certifications expiring (30d)"
            tone="warning"
            icon={<AlertIcon className="size-6" />}
            loading={certsLoading}
            value={expiringCerts}
          />
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
