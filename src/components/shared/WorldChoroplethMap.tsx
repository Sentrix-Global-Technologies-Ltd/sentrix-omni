import { useMemo } from "react";
import { VectorMap } from "@react-jvectormap/core";
import { worldMerc } from "@react-jvectormap/world";

// ─── World Choropleth Map ─────────────────────────────────────────────────────
// Uses @react-jvectormap (same library as TailAdmin "Country Traffic Analytics")
// to render a world map with countries shaded by organisation count.
//
// Country ISO-2 codes are derived from the organisation lat/lng using a
// lightweight bounding-box reverse-geocoder. This keeps the component
// self-contained with no external geocoding API calls.
// ─────────────────────────────────────────────────────────────────────────────

interface OrgPin {
  lat: number;
  lng: number;
  id: string;
}

interface WorldChoroplethMapProps {
  orgs: OrgPin[];
  className?: string;
  onCountryClick?: (isoCode: string) => void;
}

// ── Compact bounding-box reverse geocoder ─────────────────────────────────────
// [iso2, minLat, maxLat, minLng, maxLng]
const COUNTRY_BOXES: [string, number, number, number, number][] = [
  ["AF",  29.3,  38.5,  60.5,  74.9],
  ["AL",  39.6,  42.7,  19.3,  21.1],
  ["DZ",  18.9,  37.1,  -8.7,  12.0],
  ["AO", -18.1,  -4.4,  11.7,  24.1],
  ["AR", -55.0, -21.8, -73.6, -53.6],
  ["AU", -43.6,  -9.2, 113.3, 153.6],
  ["AT",  46.4,  49.0,   9.5,  17.2],
  ["AZ",  38.4,  41.9,  44.8,  50.4],
  ["BD",  20.7,  26.6,  88.0,  92.7],
  ["BE",  49.5,  51.5,   2.5,   6.4],
  ["BF",   9.4,  15.1,  -5.5,   2.4],
  ["BG",  41.2,  44.2,  22.4,  28.6],
  ["BO", -22.9,  -9.7, -69.6, -57.5],
  ["BR", -33.7,   5.3, -73.9, -34.8],
  ["BW", -26.9, -17.8,  19.9,  29.4],
  ["BY",  51.3,  56.2,  23.2,  32.7],
  ["CA",  41.7,  83.1,-141.0, -52.6],
  ["CD",  -5.0,   5.4,  12.2,  31.3],
  ["CF",   2.2,  11.0,  14.4,  27.4],
  ["CG",  -5.0,   3.7,  11.2,  18.6],
  ["CH",  45.8,  47.8,   6.0,  10.5],
  ["CI",   4.3,  10.7,  -8.6,  -2.5],
  ["CL", -55.9, -17.5, -75.7, -66.4],
  ["CM",   1.7,  13.1,   8.5,  16.2],
  ["CN",  18.2,  53.6,  73.6, 134.8],
  ["CO",  -4.2,  12.5, -79.0, -66.9],
  ["CZ",  48.5,  51.1,  12.1,  18.9],
  ["DE",  47.3,  55.1,   6.0,  15.0],
  ["DJ",  10.9,  12.7,  41.8,  43.4],
  ["DK",  54.6,  57.8,   8.1,  15.2],
  ["DZ",  18.9,  37.1,  -8.7,  12.0],
  ["EC",  -5.0,   1.5, -80.9, -75.2],
  ["EG",  22.0,  31.7,  25.0,  37.0],
  ["ER",  12.4,  18.0,  36.4,  43.1],
  ["ES",  36.0,  43.8,  -9.3,   3.3],
  ["ET",   3.4,  14.9,  33.0,  47.9],
  ["FI",  59.8,  70.1,  19.1,  31.6],
  ["FR",  41.3,  51.1,  -5.1,   9.6],
  ["GA",  -3.9,   2.3,   8.7,  14.5],
  ["GB",  49.9,  60.9,  -8.6,   1.8],
  ["GE",  41.1,  43.6,  40.0,  46.7],
  ["GH",   4.7,  11.2,  -3.3,   1.2],
  ["GM",  13.1,  13.8, -16.8, -13.8],
  ["GN",   7.2,  12.7, -15.1, -7.7],
  ["GQ",   0.9,   3.8,   8.4,  11.3],
  ["GR",  35.0,  41.7,  19.4,  26.6],
  ["GT",  13.7,  17.8, -92.2, -88.2],
  ["GW",  11.0,  12.7, -16.7, -13.6],
  ["HR",  42.4,  46.6,  13.5,  19.4],
  ["HU",  45.7,  48.6,  16.1,  22.9],
  ["ID",  -8.5,   5.9,  95.0, 141.0],
  ["IN",   6.8,  35.5,  68.2,  97.4],
  ["IQ",  29.1,  37.4,  38.8,  48.6],
  ["IR",  25.1,  39.8,  44.0,  63.3],
  ["IT",  36.6,  47.1,   6.6,  18.5],
  ["JO",  29.2,  33.4,  34.9,  39.3],
  ["JP",  24.0,  45.7, 122.8, 153.0],
  ["KE",  -4.7,   5.0,  34.0,  42.0],
  ["KG",  39.2,  43.3,  69.3,  80.3],
  ["KH",  10.4,  14.7, 102.3, 107.6],
  ["KP",  37.7,  42.7, 124.3, 130.7],
  ["KR",  33.1,  38.6, 125.9, 129.6],
  ["KW",  28.5,  30.1,  46.5,  48.4],
  ["KZ",  40.6,  55.4,  50.3,  87.3],
  ["LA",  13.9,  22.5, 100.1, 107.7],
  ["LB",  33.1,  34.7,  35.1,  36.6],
  ["LR",   4.4,   8.6, -11.5,  -7.4],
  ["LS", -30.7, -28.6,  27.0,  29.5],
  ["LY",  19.5,  33.2,  9.3,  25.2],
  ["MA",  27.7,  35.9, -13.2,  -1.0],
  ["MD",  45.5,  48.5,  26.6,  30.1],
  ["MG", -25.6,  -12.0,  43.3,  50.5],
  ["ML",  10.1,  25.0,  -4.3,   4.3],
  ["MM",  10.0,  28.5,  92.2, 101.2],
  ["MN",  41.6,  52.1,  87.8, 119.9],
  ["MR",  14.7,  27.3, -17.1,  -4.8],
  ["MW", -17.1, -9.4,  32.7,  35.9],
  ["MX",  14.5,  32.7,-117.1, -86.7],
  ["MZ", -26.9, -10.5,  30.2,  40.9],
  ["NA", -28.9, -16.9,  11.7,  25.3],
  ["NE",  11.7,  23.5,   0.2,  15.9],
  ["NG",   4.3,  13.9,   2.7,  14.7],
  ["NI",  10.7,  15.0, -87.7, -83.1],
  ["NL",  50.8,  53.5,   3.4,   7.2],
  ["NO",  57.9,  71.2,   4.5,  31.1],
  ["NP",  26.4,  30.4,  80.1,  88.2],
  ["NZ", -47.3, -34.4, 166.4, 178.6],
  ["OM",  16.6,  26.4,  51.8,  59.8],
  ["PA",   7.2,   9.7, -83.1, -77.2],
  ["PE", -18.4,  -0.0, -81.3, -68.7],
  ["PG",  -10.7,  -1.3, 141.0, 155.7],
  ["PH",   4.6,  21.1, 117.2, 126.6],
  ["PK",  23.7,  37.1,  60.9,  77.8],
  ["PL",  49.0,  54.8,  14.1,  24.2],
  ["PT",  36.8,  42.2,  -9.5,  -6.2],
  ["PY", -27.6, -19.3, -62.6, -54.3],
  ["QA",  24.6,  26.2,  50.8,  51.6],
  ["RO",  43.6,  48.3,  22.0,  29.7],
  ["RS",  42.2,  46.2,  19.0,  22.9],
  ["RU",  41.2,  81.9,  19.6, 180.0],
  ["RW",  -2.8,  -1.1,  29.0,  30.9],
  ["SA",  16.4,  32.2,  36.5,  55.7],
  ["SD",   8.7,  22.2,  24.1,  38.7],
  ["SN",  12.3,  16.7, -17.5, -11.4],
  ["SL",   6.9,   9.9, -13.3, -10.3],
  ["SN",  12.3,  16.7, -17.5, -11.4],
  ["SO",  -1.7,  12.0,  41.0,  51.4],
  ["SS",   3.5,  12.2,  24.1,  35.9],
  ["SV",  13.1,  14.4, -90.1, -87.7],
  ["SY",  32.3,  37.3,  35.7,  42.4],
  ["SZ", -27.3, -25.7,  30.8,  32.1],
  ["TD",   7.5,  23.4,  13.5,  24.0],
  ["TG",   6.1,  11.1,   0.0,   1.8],
  ["TH",   5.6,  20.5,  97.3, 105.7],
  ["TJ",  36.7,  41.1,  67.4,  75.2],
  ["TM",  35.1,  42.8,  52.4,  66.7],
  ["TN",  30.2,  37.5,   7.5,  11.6],
  ["TR",  35.8,  42.1,  26.0,  44.8],
  ["TZ",  -11.8,  -1.0,  29.3,  40.4],
  ["UA",  44.4,  52.4,  22.1,  40.2],
  ["UG",  -1.4,   4.2,  29.6,  35.0],
  ["US",  18.9,  71.4,-179.1, -66.9],
  ["UY", -34.9, -30.1, -58.4, -53.1],
  ["UZ",  37.2,  45.6,  56.0,  73.2],
  ["VE",   0.7,  12.2, -73.4, -59.8],
  ["VN",   8.6,  23.4, 102.1, 109.5],
  ["YE",  12.1,  19.0,  42.5,  54.5],
  ["ZA", -34.8, -22.1,  16.5,  32.9],
  ["ZM", -18.1,  -8.2,  21.9,  33.5],
  ["ZW", -22.4, -15.6,  25.2,  33.1],
];

function latLngToCountry(lat: number, lng: number): string | null {
  // Iterate in reverse so smaller/more specific boxes win over large ones
  for (let i = COUNTRY_BOXES.length - 1; i >= 0; i--) {
    const [iso, minLat, maxLat, minLng, maxLng] = COUNTRY_BOXES[i];
    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      return iso;
    }
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorldChoroplethMap({ orgs, className, onCountryClick }: WorldChoroplethMapProps) {
  const isDark = typeof document !== "undefined"
    && document.documentElement.classList.contains("dark");

  // Count orgs per country ISO-2 code
  const countryValues = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const org of orgs) {
      const iso = latLngToCountry(org.lat, org.lng);
      if (iso) counts[iso] = (counts[iso] ?? 0) + 1;
    }
    return counts;
  }, [orgs]);

  return (
    <div
      className={
        className ??
        "relative h-[420px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      }
    >
      <VectorMap
        map={worldMerc}
        backgroundColor="transparent"
        zoomOnScroll={true}
        regionStyle={{
          initial: {
            fill: isDark ? "#2d3748" : "#e2e8f0",
            stroke: isDark ? "#1a202c" : "#ffffff",
            strokeWidth: 0.5,
          },
          hover: {
            fill: isDark ? "#4a6fa5" : "#93b5e1",
            cursor: "pointer",
          },
          selected: {
            fill: isDark ? "#3b82f6" : "#2563eb",
          },
        }}
        series={{
          regions: [
            {
              attribute: "fill",
              values: countryValues,
              scale: isDark
                ? ["#1e3a6e", "#3b82f6"]
                : ["#c7d9f5", "#2656c7"],
              normalizeFunction: "polynomial" as const,
            },
          ],
        }}
        onRegionClick={(_e: Event, code: string) => {
          onCountryClick?.(code);
        }}
      />
    </div>
  );
}
