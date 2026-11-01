import { useCameraSourcesSummary } from '../../camera-feeds/hooks/useCameraFeeds';

/**
 * VisionGuardCameraHealthCard
 * Uses useCameraSourcesSummary() for total/online counts. Offline = total - online.
 * The summary endpoint has no "warning" field, so the Warning row shows "—"
 * rather than an invented number. When the API is unavailable every figure
 * shows "—" and an unavailable notice is displayed; nothing is fabricated.
 */
export default function VisionGuardCameraHealthCard() {
  const { data: result, isLoading, isError } = useCameraSourcesSummary();
  const summary = result?.data;

  const hasLiveData = !isLoading && !isError && summary != null;
  const total   = hasLiveData ? summary.total  : null;
  const online  = hasLiveData ? summary.online : null;
  const offline = total != null && online != null ? Math.max(0, total - online) : null;

  const onlinePct  = total != null && online != null && total > 0 ? Math.round((online / total) * 100) : null;
  const offlinePct = onlinePct != null ? 100 - onlinePct : null;

  const fmt = (n: number | null) => (isLoading ? '…' : n ?? '—');
  const fmtPct = (n: number | null) => (n == null ? '—' : `${n}%`);

  // Teal = online, grey = offline. With no live data the ring is a neutral grey.
  const ringStyle = {
    background:
      onlinePct != null
        ? `conic-gradient(#0fa9aa 0 ${onlinePct}%, #818ba0 ${onlinePct}% 100%)`
        : '#e5e9f0',
  };

  return (
    <section className="panel health-panel">
      <div className="panel-title">
        <h2>Camera Health</h2>
        <button className="text-link">All cameras</button>
      </div>

      {isError && (
        <div role="alert" style={{ padding: '4px 9px', fontSize: 12, color: '#b42318' }}>
          Camera summary unavailable.
        </div>
      )}

      <div className="health-body">
        <div className="health-ring" style={ringStyle}>
          <div>
            <strong>{fmt(total)}</strong>
            <span>Total</span>
          </div>
        </div>

        <div className="health-legend">
          <div>
            <i className="online" />
            <span>Online</span>
            <b style={{ fontSize: 12, color: '#142240' }}>{fmt(online)}</b>
            <small>{fmtPct(onlinePct)}</small>
          </div>
          <div>
            <i className="warning" />
            <span>Warning</span>
            <b style={{ fontSize: 12, color: '#142240' }} title="Not reported by the camera summary API">—</b>
            <small>—</small>
          </div>
          <div>
            <i className="offline" />
            <span>Offline</span>
            <b style={{ fontSize: 12, color: '#142240' }}>{fmt(offline)}</b>
            <small>{fmtPct(offlinePct)}</small>
          </div>
        </div>
      </div>
    </section>
  );
}
