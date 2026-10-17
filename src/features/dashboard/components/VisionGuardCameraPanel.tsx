import { useCameraSourcesSummary } from '../../camera-feeds/hooks/useCameraFeeds';
import { AudioIcon, VideoIcon, HorizontaLDots } from '../../../icons';

/**
 * VisionGuardCameraPanel
 * Full-bleed live camera panel.
 * - Top overlay: translucent light-gray bar with title, LIVE pill, expand + dots controls
 * - Image fills entire panel
 * - Bottom overlay: dark bar with status dot, location label, icon action buttons
 * MOCK: image URL and static labels are Bolt reference values — no live stream activated.
 */
export default function VisionGuardCameraPanel() {
  const { data: result } = useCameraSourcesSummary();
  const summary    = result?.data;
  const onlineCount = summary?.online ?? 0;
  const totalCount  = summary?.total ?? 0;

  return (
    <section className="panel camera-panel">
      {/* MOCK: image is the Bolt Pexels reference placeholder — no live stream */}
      <img
        className="camera-bg-img"
        src="https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=800"
        alt="Camera feed placeholder"
      />

      {/* ── Top overlay bar ── */}
      <div className="camera-topbar">
        <div className="camera-topbar-left">
          <span className="camera-topbar-title">Live Camera – North Entrance</span>
          {/* MOCK: LIVE pill — AI-watch is disabled */}
          <span className="live-pill">● LIVE</span>
        </div>
        <div className="camera-topbar-right">
          {/* Expand icon */}
          <button className="cam-overlay-btn" aria-label="Expand">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 3H21V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 21H3V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 3L14 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 21L10 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Three-dot menu */}
          <button className="cam-overlay-btn" aria-label="More options">
            <HorizontaLDots className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Bottom overlay bar ── */}
      <div className="camera-bottom">
        <span className="camera-bottom-label">
          <i className="cam-status-dot" />
          {summary
            ? `North Entrance • ${onlineCount}/${totalCount} online`
            : 'North Entrance • Camera 01'}
        </span>
        <div className="cam-ctrl-btns">
          <button className="cam-ctrl-btn" aria-label="Audio">
            <AudioIcon className="size-4" />
          </button>
          <button className="cam-ctrl-btn" aria-label="Video">
            <VideoIcon className="size-4" />
          </button>
          {/* Fullscreen */}
          <button className="cam-ctrl-btn" aria-label="Fullscreen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3H5C3.89543 3 3 3.89543 3 5V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3H19C20.1046 3 21 3.89543 21 5V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 21H5C3.89543 21 3 20.1046 3 19V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 21H19C20.1046 21 21 20.1046 21 19V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
