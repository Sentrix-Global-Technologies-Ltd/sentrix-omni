import { useCallback, useRef, useState } from "react";
import type { LayerKey, MockCameraMarker } from "../data/facilityMockData";
import {
  MOCK_BUILDINGS,
  MOCK_CAMERAS,
  MOCK_ALERTS,
  MOCK_ACCESS_POINTS,
} from "../data/facilityMockData";

// ── ViewBox ──────────────────────────────────────────────────────────────────
const VB_W = 780;
const VB_H = 540;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 4;

// ── Irregular polygon footprints for each building ───────────────────────────
// Each building has stepped / notched edges to match real building footprints.
const BUILDING_POLYGONS: Record<string, string> = {
  "bldg-a":
    "325,88 334,72 382,72 382,62 478,62 478,72 531,72 540,88 558,88 558,148 540,148 540,210 508,210 508,222 356,222 356,210 325,210 325,168 308,168 308,108 325,108",
  "bldg-b":
    "68,208 68,195 118,195 118,183 178,183 178,195 218,195 230,208 268,208 268,268 280,268 280,330 268,330 268,385 218,385 218,395 118,395 118,385 68,385 68,348 56,348 56,258 68,258",
  "bldg-c":
    "594,194 594,178 644,178 644,168 702,168 702,178 750,178 755,194 755,248 768,248 768,288 755,288 755,326 710,326 710,335 622,335 622,326 590,326 590,282 578,282 578,228 590,228",
  "bldg-d":
    "118,422 118,410 175,410 175,400 240,400 240,410 312,410 316,422 316,450 325,450 325,488 316,488 316,518 240,518 240,508 175,508 175,518 118,518 118,488 104,488 104,442 118,442",
  "bldg-e":
    "368,414 368,400 420,400 420,390 492,390 492,400 548,400 552,414 552,444 562,444 562,480 552,480 552,514 492,514 492,504 420,504 420,514 368,514 368,480 358,480 358,434 368,434",
  "parking-a":
    "582,398 730,398 730,505 582,505",
};

// Campus perimeter (dashed teal outline)
const PERIMETER =
  "M 62,118 Q 62,30 155,30 L 625,30 Q 722,30 722,118 L 722,490 Q 722,535 680,535 L 100,535 Q 62,535 62,490 Z";

// ── Aerial background tree positions ─────────────────────────────────────────
// Clusters of circles that simulate tree canopy from above
const TREES: { x: number; y: number; r: number }[] = [
  // NW grove
  { x: 88, y: 108, r: 9 }, { x: 100, y: 122, r: 7 }, { x: 78, y: 128, r: 6 },
  { x: 112, y: 108, r: 5 }, { x: 90, y: 140, r: 7 }, { x: 104, y: 148, r: 5 },
  // NE grove
  { x: 668, y: 100, r: 8 }, { x: 682, y: 112, r: 6 }, { x: 660, y: 118, r: 7 },
  { x: 695, y: 105, r: 5 }, { x: 675, y: 126, r: 6 }, { x: 648, y: 110, r: 5 },
  // Between A and B (left of A)
  { x: 278, y: 148, r: 7 }, { x: 290, y: 162, r: 6 }, { x: 268, y: 168, r: 5 },
  { x: 284, y: 178, r: 7 }, { x: 270, y: 140, r: 5 },
  // Between A and C (right of A)
  { x: 560, y: 150, r: 7 }, { x: 572, y: 162, r: 6 }, { x: 555, y: 170, r: 5 },
  { x: 568, y: 180, r: 7 }, { x: 580, y: 155, r: 5 },
  // Central courtyard (around roundabout)
  { x: 330, y: 252, r: 8 }, { x: 345, y: 268, r: 6 }, { x: 320, y: 268, r: 5 },
  { x: 438, y: 255, r: 8 }, { x: 450, y: 268, r: 6 }, { x: 428, y: 272, r: 5 },
  { x: 365, y: 288, r: 6 }, { x: 408, y: 290, r: 6 },
  // Between B and D (left corridor)
  { x: 152, y: 395, r: 7 }, { x: 166, y: 408, r: 6 }, { x: 142, y: 408, r: 5 },
  { x: 158, y: 420, r: 7 }, { x: 170, y: 425, r: 5 },
  // Between C and E (right corridor)
  { x: 578, y: 342, r: 7 }, { x: 590, y: 355, r: 6 }, { x: 570, y: 358, r: 5 },
  { x: 585, y: 368, r: 7 }, { x: 600, y: 365, r: 5 },
  // Bottom boundary
  { x: 168, y: 522, r: 8 }, { x: 182, y: 534, r: 6 }, { x: 155, y: 532, r: 5 },
  { x: 330, y: 524, r: 7 }, { x: 344, y: 534, r: 6 }, { x: 320, y: 536, r: 5 },
  { x: 548, y: 520, r: 7 }, { x: 562, y: 530, r: 6 }, { x: 540, y: 532, r: 5 },
  // Perimeter accents
  { x: 72, y: 302, r: 7 }, { x: 85, y: 314, r: 6 }, { x: 70, y: 322, r: 5 },
  { x: 72, y: 418, r: 7 }, { x: 85, y: 428, r: 6 }, { x: 70, y: 438, r: 5 },
  { x: 705, y: 380, r: 7 }, { x: 718, y: 390, r: 5 }, { x: 705, y: 400, r: 6 },
  { x: 705, y: 268, r: 7 }, { x: 718, y: 280, r: 5 }, { x: 705, y: 292, r: 6 },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function CameraMarker({
  cam,
  selected,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  cam: MockCameraMarker;
  selected: boolean;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent, id: string) => void;
  onMouseLeave: () => void;
}) {
  const fill = cam.status === "online" ? "#14b8a6" : cam.status === "idle" ? "#f59e0b" : "#94a3b8";
  return (
    <g onClick={onClick} onMouseEnter={(e) => onMouseEnter(e, cam.id)} onMouseLeave={onMouseLeave} style={{ cursor: "pointer" }}>
      {selected && <circle cx={cam.cx} cy={cam.cy} r={17} fill="none" stroke={fill} strokeWidth={2} opacity={0.4} />}
      <circle cx={cam.cx} cy={cam.cy} r={11} fill={fill} stroke="white" strokeWidth={selected ? 2.5 : 1.5} />
      {/* Camera icon */}
      <g transform={`translate(${cam.cx - 6},${cam.cy - 4.5})`}>
        <rect x={0} y={1.5} width={8} height={5.5} rx={1} fill="white" opacity={0.9} />
        <path d="M8,2.5 L11,1 L11,7 L8,5.5 Z" fill="white" opacity={0.9} />
      </g>
    </g>
  );
}

function AlertMarker({ cx, cy, severity, onClick }: { cx: number; cy: number; severity: "high" | "medium"; onClick: () => void }) {
  const fill = severity === "high" ? "#ef4444" : "#f59e0b";
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {severity === "high" && <circle cx={cx} cy={cy} r={15} fill={fill} opacity={0.15} />}
      <path d={`M${cx},${cy - 13} L${cx + 13},${cy + 8} L${cx - 13},${cy + 8} Z`}
        fill={fill} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
      <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize={10} fontWeight="700" fontFamily="sans-serif">!</text>
    </g>
  );
}

function AccessPointMarker({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill="#8b5cf6" stroke="white" strokeWidth={1.5} />
      <path d={`M${cx - 5},${cy + 2} Q${cx},${cy - 3} ${cx + 5},${cy + 2}`} fill="none" stroke="white" strokeWidth={1.2} strokeLinecap="round" />
      <path d={`M${cx - 3},${cy + 4} Q${cx},${cy + 1} ${cx + 3},${cy + 4}`} fill="none" stroke="white" strokeWidth={1.2} strokeLinecap="round" />
      <circle cx={cx} cy={cy + 6} r={1.2} fill="white" />
    </g>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
interface Props {
  layers: Record<LayerKey, boolean>;
  zoneFilter: string;
  selectedCameraId: string | null;
  selectedBuildingId: string | null;
  onSelectCamera: (id: string) => void;
  onSelectBuilding: (id: string) => void;
}

export default function FacilityMapCampus({
  layers,
  zoneFilter,
  selectedCameraId,
  selectedBuildingId,
  onSelectCamera,
  onSelectBuilding,
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z * 1.3).toFixed(3)));
  const handleZoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z / 1.3).toFixed(3)));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setZoom((prev) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * factor));
      setPan((p) => ({
        x: mouseX - (mouseX - p.x) * (next / prev),
        y: mouseY - (mouseY - p.y) * (next / prev),
      }));
      return next;
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const tag = (e.target as Element).tagName;
    if (tag === "circle" || tag === "path" || tag === "polygon") return;
    isDragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: dragStart.current.px + e.clientX - dragStart.current.mx,
      y: dragStart.current.py + e.clientY - dragStart.current.my,
    });
  };
  const stopDrag = () => { isDragging.current = false; };

  const handleMarkerEnter = (e: React.MouseEvent, id: string) => {
    const cam = MOCK_CAMERAS.find((c) => c.id === id);
    if (!cam) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      text: `${cam.label} · ${cam.status.charAt(0).toUpperCase() + cam.status.slice(1)}`,
    });
  };

  const visibleCameras = layers.cameras ? MOCK_CAMERAS.filter(
    (c) => zoneFilter === "all" || c.buildingId === zoneFilter
  ) : [];

  const visibleBuildings = MOCK_BUILDINGS.filter((b) =>
    (zoneFilter === "all" || b.id === zoneFilter)
  );
  const visibleAlerts = layers.alerts ? MOCK_ALERTS : [];
  const visibleAccessPoints = layers["access-points"] ? MOCK_ACCESS_POINTS : [];

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  // Ground / landscape colours
  const groundBase = isDark ? "#0e1e2e" : "#dce8d8";
  const grassFill = isDark ? "#0d2218" : "#c2d8be";
  const roadFill = isDark ? "#1a2d42" : "#b4c4cc";
  const roadLight = isDark ? "#162438" : "#c8d8de";
  const treeFill = isDark ? "#1a4a2e" : "#4e8a5a";

  return (
    <div
      className="fm-map-wrap"
      ref={wrapRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
    >
      {/* Zoom controls */}
      <div className="fm-zoom-controls">
        <button className="fm-zoom-btn" onClick={handleZoomIn} title="Zoom in">+</button>
        <button className="fm-zoom-btn" onClick={handleZoomOut} title="Zoom out">−</button>
        <button className="fm-zoom-btn" onClick={handleReset} title="Reset view" style={{ fontSize: "0.75rem" }}>⊙</button>
      </div>

      {/* Pannable / zoomable layer — fills wrapper at zoom=1 */}
      <div
        className="fm-map-inner"
        style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          width="100%"
          height="100%"
          style={{ display: "block" }}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Facility campus map — demonstration data"
        >
          {/* ══════════ AERIAL BACKGROUND ══════════ */}

          {/* Sky / outer ground */}
          <rect width={VB_W} height={VB_H} fill={isDark ? "#091520" : "#ced8d0"} />

          {/* Campus ground base */}
          <path
            d="M 62,118 Q 62,30 155,30 L 625,30 Q 722,30 722,118 L 722,490 Q 722,535 680,535 L 100,535 Q 62,535 62,490 Z"
            fill={groundBase}
          />

          {/* Grass lawn areas */}
          <ellipse cx={162} cy={295} rx={72} ry={58} fill={grassFill} opacity={0.75} />
          <ellipse cx={530} cy={252} rx={48} ry={36} fill={grassFill} opacity={0.65} />
          <ellipse cx={390} cy={300} rx={44} ry={30} fill={grassFill} opacity={0.6} />
          <ellipse cx={658} cy={420} rx={36} ry={26} fill={grassFill} opacity={0.55} />
          <ellipse cx={390} cy={468} rx={28} ry={18} fill={grassFill} opacity={0.5} />
          <ellipse cx={160} cy={462} rx={50} ry={20} fill={grassFill} opacity={0.45} />

          {/* Ring road */}
          <path
            d="M 98,120 Q 98,68 152,68 L 628,68 Q 700,68 700,120 L 700,482 Q 700,512 668,512 L 112,512 Q 98,512 98,482 Z"
            fill="none"
            stroke={roadFill}
            strokeWidth={22}
          />

          {/* Central horizontal road */}
          <rect x={265} y={304} width={250} height={20} fill={roadFill} />
          {/* Cross road vertical — building A top to roundabout */}
          <rect x={376} y={68} width={20} height={240} fill={roadFill} />
          {/* Cross road vertical — roundabout to bottom */}
          <rect x={376} y={324} width={20} height={188} fill={roadFill} />
          {/* Left spoke (roundabout to ring road) */}
          <rect x={98} y={306} width={170} height={20} fill={roadFill} />
          {/* Right spoke (roundabout to ring road) */}
          <rect x={518} y={306} width={182} height={20} fill={roadFill} />

          {/* Entrance fork at bottom */}
          <rect x={356} y={490} width={60} height={26} fill={roadFill} />
          {/* Entrance label road */}
          <rect x={371} y={510} width={30} height={28} fill={roadFill} />

          {/* Roundabout */}
          <circle cx={386} cy={314} r={32} fill={roadFill} />
          <circle cx={386} cy={314} r={22} fill={grassFill} opacity={0.8} />
          <circle cx={386} cy={314} r={9} fill={roadLight} />

          {/* Sidewalks / path network */}
          <rect x={266} y={300} width={250} height={4} fill={roadLight} opacity={0.6} />
          <rect x={374} y={68} width={4} height={240} fill={roadLight} opacity={0.6} />

          {/* Parking lot texture (Parking Lot A) */}
          <rect x={582} y={398} width={148} height={107} fill={isDark ? "#182838" : "#c8d4dc"} opacity={0.8} />
          {/* Parking rows */}
          {[410, 425, 440, 455, 470, 485].map((y) => (
            <line key={y} x1={582} y1={y} x2={730} y2={y} stroke={roadFill} strokeWidth={1} opacity={0.5} />
          ))}
          {[600, 620, 640, 660, 680, 700, 720].map((x) => (
            <line key={x} x1={x} y1={398} x2={x} y2={505} stroke={roadFill} strokeWidth={0.8} opacity={0.4} />
          ))}

          {/* ── Tree canopy clusters ─────────────────────────────────────── */}
          {TREES.map((t, i) => (
            <circle key={i} cx={t.x} cy={t.y} r={t.r} fill={treeFill} opacity={isDark ? 0.6 : 0.72} />
          ))}
          {/* Tree shadow dots */}
          {TREES.map((t, i) => (
            <circle key={`s${i}`} cx={t.x + 2} cy={t.y + 2} r={t.r * 0.55} fill={isDark ? "#000" : "#3a6040"} opacity={0.18} />
          ))}

          {/* ══════════ PERIMETER ══════════ */}
          {layers.perimeter && (
            <path
              d={PERIMETER}
              fill="none"
              stroke="#14b8a6"
              strokeWidth={2.5}
              strokeDasharray="11,5"
              opacity={0.9}
            />
          )}

          {/* ══════════ BUILDINGS ══════════ */}
          {visibleBuildings.map((b) => {
            const pts = BUILDING_POLYGONS[b.id];
            if (!pts) return null;
            const isSelected = selectedBuildingId === b.id;
            // Center label from bounding rect
            const cx = b.x + b.w / 2;
            const cy = b.y + b.h / 2;
            return (
              <g key={b.id} onClick={() => onSelectBuilding(b.id)} style={{ cursor: "pointer" }}>
                {/* Selected glow */}
                {isSelected && (
                  <polygon
                    points={pts}
                    fill="none"
                    stroke={b.stroke}
                    strokeWidth={5}
                    opacity={0.3}
                    strokeLinejoin="round"
                  />
                )}
                {/* Building fill */}
                <polygon
                  points={pts}
                  fill={isDark ? b.fillDark : b.fill}
                  stroke={b.stroke}
                  strokeWidth={isSelected ? 2.5 : 1.8}
                  strokeLinejoin="round"
                  opacity={0.92}
                />
                {/* Labels */}
                {layers["building-labels"] && (
                  <>
                    <text
                      x={cx} y={cy - 7}
                      textAnchor="middle"
                      fontSize={13}
                      fontWeight="700"
                      fontFamily="system-ui,sans-serif"
                      fill={isDark ? "rgba(255,255,255,0.88)" : "#1e293b"}
                      style={{ pointerEvents: "none" }}
                    >
                      {b.name}
                    </text>
                    <text
                      x={cx} y={cy + 10}
                      textAnchor="middle"
                      fontSize={11}
                      fontFamily="system-ui,sans-serif"
                      fill={isDark ? "rgba(255,255,255,0.5)" : "#475569"}
                      style={{ pointerEvents: "none" }}
                    >
                      {b.cameraCount} Cameras
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* ══════════ ACCESS POINTS ══════════ */}
          {visibleAccessPoints.map((ap) => (
            <AccessPointMarker key={ap.id} cx={ap.cx} cy={ap.cy} />
          ))}

          {/* ══════════ ALERT MARKERS ══════════ */}
          {visibleAlerts.map((al) => (
            <AlertMarker
              key={al.id}
              cx={al.cx}
              cy={al.cy}
              severity={al.severity}
              onClick={() => {
                const bldg = MOCK_BUILDINGS.find(
                  (b) => al.cx >= b.x && al.cx <= b.x + b.w && al.cy >= b.y && al.cy <= b.y + b.h
                );
                if (bldg) onSelectBuilding(bldg.id);
              }}
            />
          ))}

          {/* ══════════ CAMERA MARKERS ══════════ */}
          {visibleCameras.map((cam) => (
            <CameraMarker
              key={cam.id}
              cam={cam}
              selected={selectedCameraId === cam.id}
              onClick={() => onSelectCamera(cam.id)}
              onMouseEnter={handleMarkerEnter}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}

          {/* Main Entrance label */}
          {layers["building-labels"] && (
            <text
              x={386} y={524}
              textAnchor="middle"
              fontSize={11}
              fontWeight="600"
              fontFamily="system-ui,sans-serif"
              fill={isDark ? "rgba(255,255,255,0.45)" : "#64748b"}
            >
              Main Entrance
            </text>
          )}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fm-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
