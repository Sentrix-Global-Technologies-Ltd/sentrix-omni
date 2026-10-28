/**
 * Classifies a free-text detection type from the Ingest pipeline into one
 * of the four dashboard display categories.
 *
 * The backend `type` field is free text produced by the AI pipeline or an
 * upstream vision provider; new values may appear as the system evolves.
 * Classification uses an explicit allow-list. Unknown types fall back to
 * "activity" — the broadest behavioural catch-all — rather than silently
 * dropping or misrepresenting them.
 *
 * Known backend type values (from feature tests and DTO inspection):
 *   loitering, weapon_detected, intrusion, perimeter_breach, + others below.
 *
 * When the pipeline emits a type not listed here, add it to CATEGORY_MAP
 * with its correct category rather than extending the fallback logic.
 */

export type DetectionCategory = "vehicle" | "person" | "activity" | "security";

/**
 * Explicit mapping of known backend `type` strings to display category.
 * Keys are lowercase and trimmed to match the normalisation in classifyDetection.
 */
export const CATEGORY_MAP: Readonly<Record<string, DetectionCategory>> = {
  // ── Vehicle ────────────────────────────────────────────────────────────
  vehicle:              "vehicle",
  vehicle_detected:     "vehicle",
  license_plate:        "vehicle",
  parking_violation:    "vehicle",

  // ── Person ─────────────────────────────────────────────────────────────
  person:               "person",
  person_detected:      "person",
  face_detected:        "person",
  face_recognition:     "person",
  crowd_detected:       "person",

  // ── Activity (behavioural patterns, movement anomalies) ────────────────
  loitering:            "activity",
  tailgating:           "activity",
  crowd_formation:      "activity",
  fighting:             "activity",
  running:              "activity",
  motion_detected:      "activity",
  motion:               "activity",

  // ── Security (access breaches and active threats) ──────────────────────
  perimeter_breach:     "security",
  intrusion:            "security",
  weapon_detected:      "security",
  fire_detected:        "security",
  smoke_detected:       "security",
  forced_entry:         "security",
  theft:                "security",
  vandalism:            "security",
  suspicious_object:    "security",
} as const;

/**
 * Fallback for type strings not yet in CATEGORY_MAP.
 * "activity" is the broadest category and the least likely to misrepresent
 * an unknown detection as a vehicle or a security breach.
 */
export const UNKNOWN_CATEGORY_FALLBACK: DetectionCategory = "activity";

/**
 * Classify a raw detection type string from the backend.
 *
 * @param type  The `type` field from DetectionEventResource (free text).
 * @returns     One of "vehicle" | "person" | "activity" | "security".
 *              Returns "activity" for null, undefined, or unrecognised values.
 */
export function classifyDetection(type: string | null | undefined): DetectionCategory {
  if (!type) return UNKNOWN_CATEGORY_FALLBACK;
  const normalized = type.toLowerCase().trim();
  return CATEGORY_MAP[normalized] ?? UNKNOWN_CATEGORY_FALLBACK;
}
