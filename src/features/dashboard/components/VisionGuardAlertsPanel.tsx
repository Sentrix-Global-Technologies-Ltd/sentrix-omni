import { useEmergencies } from '../../emergencies/hooks/useEmergencies';
import type { Emergency } from '../../emergencies/api/emergencies.types';
import Badge from '../../../components/ui/badge/Badge';
import { AlertIcon } from '../../../icons';

/* ── Inline SVG: Bell icon ── */
function BellIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

/* ── Inline SVG: Car icon for vehicle alerts ── */
function CarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2" />
      <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function titleFromEmergency(e: Emergency): string {
  if (e.message) return e.message.slice(0, 40);
  return `${e.severity.charAt(0).toUpperCase() + e.severity.slice(1)} Emergency`;
}

/** Map emergency severity → Sentrix Badge color */
function sevColor(sev: string): "error" | "warning" | "info" {
  if (sev === 'critical' || sev === 'high') return 'error';
  if (sev === 'medium' || sev === 'warning') return 'warning';
  return 'info';
}

/** MOCK: Bolt reference alert rows — shown when no triggered emergencies exist */
const MOCK_ALERTS = [
  { title: 'Perimeter Breach',              location: 'North Gate — Building A', severity: 'high',   time: '2 min ago' },
  { title: 'Loitering Detected',            location: 'Parking Lot B',           severity: 'medium', time: '5 min ago' },
  { title: 'Vehicle Without Authorization', location: 'East Entrance',            severity: 'medium', time: '8 min ago' },
  { title: 'AI Model Performance Warning',  location: 'Camera Zone 7',           severity: 'low',    time: '15 min ago' },
];

/**
 * VisionGuardAlertsPanel
 * Shows triggered emergencies from useEmergencies({ status: 'triggered' }).
 * MOCK: Falls back to Bolt reference rows when the result is empty.
 * Uses Sentrix Badge for severity labels.
 */
export default function VisionGuardAlertsPanel() {
  const { data: result, isLoading, isError } = useEmergencies({ status: 'triggered' });
  const emergencies = result?.data ?? [];

  const useMock = !isLoading && !isError && emergencies.length === 0;
  const liveRows = emergencies.slice(0, 4);

  return (
    <section className="panel alerts-panel">
      <div className="panel-title">
        <h2>
          Active Alerts
          {useMock && (
            <span title="Mock data — no triggered emergencies" style={{ fontSize: 9, opacity: 0.4 }}>*</span>
          )}
        </h2>
        <button className="text-link">View all</button>
      </div>

      <div className="alerts-list">
        {isLoading && (
          <div style={{ padding: '16px 0', fontSize: 12, color: '#8290a1' }}>Loading…</div>
        )}

        {!isLoading && !useMock && liveRows.map(e => (
          <div className="alert-row" key={e.id}>
            <div className={`alert-icon ${e.severity === 'critical' ? 'high' : e.severity}`}>
              <BellIcon size={13} />
            </div>
            <div className="alert-copy">
              <strong>{titleFromEmergency(e)}</strong>
              <span>{e.status}</span>
            </div>
            <div className="alert-meta">
              <span>{timeAgo(e.triggered_at)}</span>
              <Badge size="sm" color={sevColor(e.severity)}>
                {e.severity.charAt(0).toUpperCase() + e.severity.slice(1)}
              </Badge>
            </div>
          </div>
        ))}

        {/* MOCK: Bolt reference rows when no live triggered emergencies */}
        {useMock && MOCK_ALERTS.map((a, i) => (
          <div className="alert-row" key={i}>
            <div className={`alert-icon ${a.severity}`}>
              {a.title.toLowerCase().includes('vehicle')
                ? <CarIcon size={13} />
                : <BellIcon size={13} />}
            </div>
            <div className="alert-copy">
              <strong>{a.title}</strong>
              <span>{a.location}</span>
            </div>
            <div className="alert-meta">
              <span>{a.time}</span>
              <Badge size="sm" color={sevColor(a.severity)}>
                {a.severity.charAt(0).toUpperCase() + a.severity.slice(1)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
