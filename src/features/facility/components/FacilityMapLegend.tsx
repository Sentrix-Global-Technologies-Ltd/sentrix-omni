export default function FacilityMapLegend() {
  return (
    <div className="fm-legend">
      <div className="fm-legend-item">
        <div className="fm-legend-dot fm-legend-dot--online" />
        Online Camera
      </div>
      <div className="fm-legend-sep" />
      <div className="fm-legend-item">
        <div className="fm-legend-dot fm-legend-dot--idle" />
        Idle Camera
      </div>
      <div className="fm-legend-sep" />
      <div className="fm-legend-item">
        <div className="fm-legend-dot fm-legend-dot--offline" />
        Offline Camera
      </div>
      <div className="fm-legend-sep" />
      <div className="fm-legend-item">
        <div className="fm-legend-tri fm-legend-tri--high" />
        Active Alert (High)
      </div>
      <div className="fm-legend-sep" />
      <div className="fm-legend-item">
        <div className="fm-legend-tri fm-legend-tri--medium" />
        Active Alert (Medium)
      </div>
      <div className="fm-legend-sep" />
      <div className="fm-legend-item">
        <div className="fm-legend-zone fm-legend-zone--normal" />
        Zone
      </div>
      <div className="fm-legend-sep" />
      <div className="fm-legend-item">
        <div className="fm-legend-zone fm-legend-zone--active" />
        Active Zone
      </div>
      <div className="fm-legend-sep" />
      <div className="fm-legend-item">
        <div className="fm-legend-perimeter" />
        Perimeter
      </div>
      <div className="fm-legend-sep" />
      <div className="fm-legend-item">
        <div className="fm-legend-ap" />
        Access Point
      </div>
    </div>
  );
}
