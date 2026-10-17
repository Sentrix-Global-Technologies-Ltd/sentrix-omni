import { useCameraSourcesSummary } from '../../camera-feeds/hooks/useCameraFeeds';

// MOCK: warning count has no field in CameraSourcesSummary — kept as Bolt reference
const MOCK_WARNING_COUNT = 10;

/**
 * VisionGuardCameraHealthCard
 * Uses useCameraSourcesSummary() for total/online counts.
 * MOCK: Warning count is a Bolt reference (10) — CameraSourcesSummary has no
 *       warning field. Offline = total - online (real). Ring proportions use
 *       real online % when data is available.
 */
export default function VisionGuardCameraHealthCard() {
  const { data: result, isLoading, isError } = useCameraSourcesSummary();
  const summary = result?.data;

  const hasLiveData = !isLoading && !isError && summary != null;
  // MOCK: fall back to Bolt reference values when no live data
  const total   = hasLiveData ? summary!.total  : 128;
  const online  = hasLiveData ? summary!.online : 112;
  // MOCK: warning is always Bolt's placeholder — no API field
  const warning = MOCK_WARNING_COUNT;
  const offline = Math.max(0, total - online - warning);
  const isMock  = !hasLiveData && !isLoading;

  const onlinePct  = total > 0 ? Math.round((online  / total) * 100) : 68;
  const warningPct = total > 0 ? Math.round((warning / total) * 100) : 8;
  // offline fills the rest
  const ringStyle = {
    background: `conic-gradient(#0fa9aa 0 ${onlinePct}%, #f0a53a ${onlinePct}% ${onlinePct + warningPct}%, #818ba0 ${onlinePct + warningPct}% 100%)`,
  };

  return (
    <section className="panel health-panel">
      <div className="panel-title">
        <h2>
          Camera Health
          {isMock && (
            <span title="Mock data — no live camera summary" style={{ fontSize: 9, opacity: 0.4 }}>*</span>
          )}
        </h2>
        <button className="text-link">All cameras</button>
      </div>

      <div className="health-body">
        <div className="health-ring" style={ringStyle}>
          <div>
            <strong>{isLoading ? '…' : total}</strong>
            <span>Total</span>
          </div>
        </div>

        <div className="health-legend">
          <div>
            <i className="online" />
            <span>Online</span>
            <b style={{ fontSize: 12, color: '#142240' }}>{isLoading ? '…' : online}</b>
            <small>{onlinePct}%</small>
          </div>
          <div>
            <i className="warning" />
            <span>Warning</span>
            {/* MOCK: warning count */}
            <b style={{ fontSize: 12, color: '#142240' }}>{warning}<span title="Mock value" style={{ fontSize: 8, opacity: 0.4 }}>*</span></b>
            <small>{warningPct}%</small>
          </div>
          <div>
            <i className="offline" />
            <span>Offline</span>
            <b style={{ fontSize: 12, color: '#142240' }}>{isLoading ? '…' : offline}</b>
            <small>{100 - onlinePct - warningPct}%</small>
          </div>
        </div>
      </div>
    </section>
  );
}
