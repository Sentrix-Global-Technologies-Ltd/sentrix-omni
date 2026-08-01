import type { FacilityBuilding, FacilityZone } from "../api/facility.types";

interface Props {
  buildings: FacilityBuilding[];
  selectedZoneId: string | null;
  onSelectZone: (buildingId: string, zone: FacilityZone) => void;
  onSelectBuilding: (building: FacilityBuilding) => void;
}

/** Same tone palette as OrganizationsDirectoryPage's subscriptionColor — kept
 * as raw hex since these are SVG fills, not Tailwind classes. */
const SUCCESS = "#12b76a";
const WARNING = "#f79009";
const ERROR = "#f04438";
const LIGHT = "#d0d5dd";

function zoneColor(zone: FacilityZone): string {
  if (zone.cameras_total === 0) return LIGHT;
  if (zone.cameras_online === zone.cameras_total) return SUCCESS;
  if (zone.cameras_online === 0) return ERROR;
  return WARNING;
}

/**
 * A relative (0-100 percentage) canvas of the org's buildings and zones —
 * see the facility_buildings/facility_zones migration docblock for why this
 * is an admin-drawn diagram rather than a GPS-accurate floor plan. Zone fill
 * color is derived from real camera online/offline counts (not decorative).
 */
export default function FacilityMapCanvas({ buildings, selectedZoneId, onSelectZone, onSelectBuilding }: Props) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
      <svg viewBox="0 0 100 62.5" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        {buildings.map((building) => (
          <g key={building.id}>
            <rect
              x={building.x}
              y={building.y * 0.625}
              width={building.width}
              height={building.height * 0.625}
              rx={1}
              className="cursor-pointer fill-brand-50 stroke-brand-300 dark:fill-brand-500/10 dark:stroke-brand-500/40"
              strokeWidth={0.3}
              onClick={() => onSelectBuilding(building)}
            />
            <text
              x={building.x + 1}
              y={building.y * 0.625 + 3}
              fontSize={2.6}
              className="pointer-events-none fill-gray-500 dark:fill-gray-400"
            >
              {building.name}
            </text>
            {building.zones.map((zone) => {
              const zx = building.x + (zone.x / 100) * building.width;
              const zy = (building.y + (zone.y / 100) * building.height) * 0.625;
              const zw = (zone.width / 100) * building.width;
              const zh = ((zone.height / 100) * building.height) * 0.625;
              const selected = zone.id === selectedZoneId;

              return (
                <g key={zone.id}>
                  <rect
                    x={zx}
                    y={zy}
                    width={zw}
                    height={zh}
                    rx={0.6}
                    fill={zoneColor(zone)}
                    fillOpacity={selected ? 0.85 : 0.55}
                    stroke={selected ? "#155eef" : "transparent"}
                    strokeWidth={selected ? 0.5 : 0}
                    className="cursor-pointer transition-opacity hover:fill-opacity-80"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectZone(building.id, zone);
                    }}
                  />
                  {zone.cameras.map((cam, i) => (
                    <circle
                      key={cam.id}
                      cx={zx + zw / 2 + (i % 3) * 1.5 - 1.5}
                      cy={zy + zh / 2 + Math.floor(i / 3) * 1.5}
                      r={0.6}
                      fill={cam.feed_status === "live" ? SUCCESS : cam.feed_status === "offline" ? ERROR : LIGHT}
                      stroke="white"
                      strokeWidth={0.15}
                    />
                  ))}
                </g>
              );
            })}
          </g>
        ))}
      </svg>

      {buildings.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-theme-sm text-gray-400">
          No buildings drawn yet — add one to start mapping this site.
        </div>
      )}
    </div>
  );
}
