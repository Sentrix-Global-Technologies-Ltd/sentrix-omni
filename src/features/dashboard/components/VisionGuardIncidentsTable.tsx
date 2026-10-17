import { useIncidents } from '../../incidents/hooks/useIncidents';
import type { Incident, IncidentStatus, IncidentSeverity } from '../../incidents/api/incidents.types';
import Badge from '../../../components/ui/badge/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '../../../components/ui/table';

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function shortId(id: string): string {
  return 'INC-' + id.replace(/-/g, '').slice(0, 6).toUpperCase();
}

/** Map severity → Badge color */
function sevColor(sev: string): "error" | "warning" | "info" {
  const s = sev.toLowerCase();
  if (s === 'critical' || s === 'high') return 'error';
  if (s === 'medium') return 'warning';
  return 'info';
}

/** Map status → Badge color */
function statusColor(
  status: string,
): "primary" | "success" | "light" {
  const s = status.toLowerCase();
  if (s === 'resolved') return 'success';
  if (s === 'closed') return 'light';
  return 'primary'; // open, new, investigating
}

/** MOCK: Bolt reference rows — shown when no incidents exist */
const MOCK_ROWS = [
  { id: 'INC-2024-1021', title: 'Perimeter Breach',     location: 'Building A',    time: 'May 22 09:14 AM', severity: 'high',   status: 'Investigating' },
  { id: 'INC-2024-1020', title: 'Loitering',            location: 'Parking Lot B', time: 'May 22 09:08 AM', severity: 'medium', status: 'New'           },
  { id: 'INC-2024-1019', title: 'Unauthorized Access',  location: 'East Entrance', time: 'May 22 08:56 AM', severity: 'high',   status: 'Investigating' },
  { id: 'INC-2024-1018', title: 'Vehicle Without Auth', location: 'South Gate',    time: 'May 22 08:42 AM', severity: 'medium', status: 'Resolved'      },
  { id: 'INC-2024-1017', title: 'Suspicious Activity',  location: 'Loading Dock',  time: 'May 22 08:31 AM', severity: 'low',    status: 'Resolved'      },
];

/**
 * VisionGuardIncidentsTable
 * Shows the first 5 incidents from useIncidents({}).
 * MOCK: Falls back to Bolt reference rows when the result is empty.
 * Uses Sentrix Table + Badge components.
 */
export default function VisionGuardIncidentsTable() {
  const { data: result, isLoading, isError } = useIncidents({});
  const incidents: Incident[] = result?.data ?? [];
  const useMock = !isLoading && !isError && incidents.length === 0;
  const rows = incidents.slice(0, 5);

  return (
    <section className="panel incidents-panel">
      <div className="panel-title">
        <h2>
          Recent Incidents
          {useMock && (
            <span title="Mock data — no incidents found" style={{ fontSize: 9, opacity: 0.4 }}>*</span>
          )}
        </h2>
        <button className="text-link">View all</button>
      </div>

      <div className="table-wrap">
        {isLoading && (
          <div style={{ padding: '16px 9px', fontSize: 12, color: '#8290a1' }}>Loading…</div>
        )}

        {!isLoading && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>ID</TableCell>
                <TableCell isHeader>Title</TableCell>
                <TableCell isHeader>Time</TableCell>
                <TableCell isHeader>Severity</TableCell>
                <TableCell isHeader>Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!useMock && rows.map((inc: Incident) => (
                <TableRow key={inc.id}>
                  <TableCell>{shortId(inc.id)}</TableCell>
                  <TableCell>{inc.title}</TableCell>
                  <TableCell>{timeAgo(inc.opened_at)}</TableCell>
                  <TableCell>
                    <Badge size="sm" color={sevColor(inc.severity as IncidentSeverity)}>
                      {(inc.severity as string).charAt(0).toUpperCase() +
                        (inc.severity as string).slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge size="sm" color={statusColor(inc.status as IncidentStatus)}>
                      {(inc.status as string).charAt(0).toUpperCase() +
                        (inc.status as string).slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}

              {/* MOCK: Bolt reference rows */}
              {useMock && MOCK_ROWS.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.title}</TableCell>
                  <TableCell>{r.time}</TableCell>
                  <TableCell>
                    <Badge size="sm" color={sevColor(r.severity)}>
                      {r.severity.charAt(0).toUpperCase() + r.severity.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge size="sm" color={statusColor(r.status)}>
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}
