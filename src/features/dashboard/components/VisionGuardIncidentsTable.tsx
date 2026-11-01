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

/**
 * Demo mode is opt-in: local development (import.meta.env.DEV) or an explicit
 * VITE_DEMO_MODE=true. Same gate as the Evidence console. Never on in a
 * production build unless explicitly enabled.
 */
const DEMO_ENABLED =
  import.meta.env.DEV === true || import.meta.env.VITE_DEMO_MODE === 'true';

/** Illustrative rows, shown only in demo mode after a successful empty API response. */
const DEMO_ROWS = [
  { id: 'DEMO-1', title: 'Perimeter Breach',     time: 'Sample', severity: 'high',   status: 'Investigating' },
  { id: 'DEMO-2', title: 'Loitering',            time: 'Sample', severity: 'medium', status: 'New'           },
  { id: 'DEMO-3', title: 'Unauthorized Access',  time: 'Sample', severity: 'high',   status: 'Investigating' },
];

/**
 * VisionGuardIncidentsTable
 * Shows the first 5 incidents from useIncidents({}).
 * - API error  -> error message (never demo rows).
 * - API empty  -> genuine empty state; labelled demo rows only when demo mode is enabled.
 */
export default function VisionGuardIncidentsTable() {
  const { data: result, isLoading, isError } = useIncidents({});
  const incidents: Incident[] = result?.data ?? [];
  const isEmpty = !isLoading && !isError && incidents.length === 0;
  const useDemo = isEmpty && DEMO_ENABLED;
  const rows = incidents.slice(0, 5);

  return (
    <section className="panel incidents-panel">
      <div className="panel-title">
        <h2>
          Recent Incidents
          {useDemo && (
            <span
              className="demo-badge"
              title="Demo data — not real incidents"
              style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 6px', borderRadius: 4, background: '#fef3c7', color: '#92400e' }}
            >
              DEMO DATA
            </span>
          )}
        </h2>
        <button className="text-link">View all</button>
      </div>

      <div className="table-wrap">
        {isLoading && (
          <div style={{ padding: '16px 9px', fontSize: 12, color: '#8290a1' }}>Loading…</div>
        )}

        {isError && (
          <div role="alert" style={{ padding: '16px 9px', fontSize: 12, color: '#b42318' }}>
            Failed to load incidents.
          </div>
        )}

        {isEmpty && !useDemo && (
          <div style={{ padding: '16px 9px', fontSize: 12, color: '#8290a1' }}>No incidents found.</div>
        )}

        {!isLoading && !isError && !isEmpty || useDemo ? (
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
              {!useDemo && rows.map((inc: Incident) => (
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

              {useDemo && DEMO_ROWS.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.title} <em style={{ fontSize: 10, opacity: 0.7 }}>(demo)</em></TableCell>
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
        ) : null}
      </div>
    </section>
  );
}
