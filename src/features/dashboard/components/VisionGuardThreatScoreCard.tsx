import { useThreatScore } from '../../intel/hooks/useIntel';
import type { ThreatScore } from '../../intel/api/intel.types';
import { AlertHexaIcon, ArrowRightIcon, InfoIcon } from '../../../icons';

/* ── Icon: Activity (inline SVG — no lucide dependency) ── */
function ActivityIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

/* ── Helpers ── */
function factorLabel(type: string): string {
  const map: Record<string, string> = {
    motion_detection:    'Unusual Motion',
    perimeter_breach:    'Perimeter Breach Attempts',
    loitering:           'Loitering Events',
    unauthorized_access: 'Unauthorized Access',
    vehicle:             'Vehicle Incidents',
  };
  return map[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function scoreBand(s: number): string {
  if (s >= 70) return 'Critical';
  if (s >= 35) return 'Elevated';
  return 'Nominal';
}

type DisplayFactor = { label: string; value: string };

function buildFactors(ts: ThreatScore | undefined): DisplayFactor[] {
  if (ts?.factors?.length) {
    return ts.factors.slice(0, 3).map(f => ({
      label: factorLabel(f.type),
      value: f.change_pct != null
        ? `${f.change_pct > 0 ? '+' : ''}${f.change_pct}%`
        : String(f.count),
    }));
  }
  // MOCK: Bolt reference factor rows — shown when no live threat-factor data
  return [
    { label: 'Unusual Motion',             value: '34%' },
    { label: 'Perimeter Breach Attempts',  value: '12%' },
    { label: 'Loitering Events',           value: '9%'  },
  ];
}

/**
 * VisionGuardThreatScoreCard
 * Uses useThreatScore() for real score + factors when an org is active.
 * MOCK: Falls back to Bolt score of 78 + mock factors when data is unavailable.
 * A failed request must not be mistaken for a legitimate empty response —
 * isError keeps the mock rather than showing 0.
 */
export default function VisionGuardThreatScoreCard() {
  const { data: result, isLoading, isError } = useThreatScore();
  const ts = result?.data; // ThreatScore | undefined

  // MOCK: score 78 is the Bolt reference placeholder
  const hasLiveData = !isLoading && !isError && ts != null;
  const score = hasLiveData ? ts!.score : 78;
  const band  = scoreBand(score);
  const factors = buildFactors(hasLiveData ? ts : undefined);
  const ringStyle = {
    background: `conic-gradient(#0dacae 0 ${score}%, #e2f0f0 ${score}% 100%)`,
  };

  const factorIcons = [
    <ActivityIcon key="0" size={14} />,
    <AlertHexaIcon key="1" style={{ width: 14, height: 14 }} />,
    <AlertHexaIcon key="2" style={{ width: 14, height: 14 }} />,
  ];

  return (
    <section className="panel threat-panel">
      <div className="panel-title">
        <h2>
          Live Threat Score{' '}
          {/* MOCK indicator: asterisk when showing Bolt placeholder score */}
          {!hasLiveData && !isLoading && (
            <span title="Mock value — no live threat data available"
              style={{ fontSize: 9, opacity: 0.4, cursor: 'help' }}>*</span>
          )}
          <InfoIcon style={{ width: 13, height: 13 }} />
        </h2>
        <button className="text-link">Details</button>
      </div>

      <div className="threat-body">
        <div className="score-ring" style={ringStyle}>
          <div>
            <strong>{isLoading ? '…' : score}</strong>
            <span>/100</span>
            <b>{band}</b>
          </div>
        </div>

        <div className="threat-copy">
          <p>
            {hasLiveData
              ? `Threat level is ${band.toLowerCase()}. ${ts!.open_incidents_count} open incident${ts!.open_incidents_count !== 1 ? 's' : ''}, ${ts!.active_emergencies_count} active emergency${ts!.active_emergencies_count !== 1 ? 's' : ''}.`
              : 'Threat level is elevated. Monitoring unusual activity across all zones.'}
          </p>
          {factors.map((f, i) => (
            <div className="factor" key={f.label}>
              {factorIcons[i] ?? factorIcons[1]}
              <span>{f.label}</span>
              <b>{f.value}</b>
            </div>
          ))}
        </div>
      </div>

      <button className="panel-action">
        View Threat Intelligence{' '}
        <ArrowRightIcon style={{ width: 15, height: 15 }} />
      </button>
    </section>
  );
}
