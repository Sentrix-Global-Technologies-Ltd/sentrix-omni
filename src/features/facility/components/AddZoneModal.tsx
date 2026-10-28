import { useState, useEffect, useRef, useMemo } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { useFacilityActions } from "../hooks/useFacilityMap";
import { MIN_ZONE_SIZE_PCT, rectanglesOverlap } from "../utils/coordinateHelpers";
import type { FacilityZone } from "../api/facility.types";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const fieldErrorClass =
  "h-11 w-full rounded-lg border border-red-400 bg-transparent px-4 text-sm text-gray-800 focus:border-red-400 focus:outline-hidden focus:ring-3 focus:ring-red-400/10 dark:border-red-500 dark:bg-gray-900 dark:text-white/90";

interface Rect { x: number; y: number; width: number; height: number; }

interface Props {
  open: boolean;
  onClose: () => void;
  buildingId: string | null;
  buildingName: string;
  /** Pre-drawn geometry (zone-pct) from the map draw gesture. Synced on open. */
  initialRect?: Rect | null;
  /**
   * Existing zones in this building, used to detect overlaps before submission.
   * Pass the full `building.zones` array from the store; the modal excludes
   * nothing (there is no editing ID — this is always a create modal).
   */
  existingZones?: FacilityZone[];
}

/**
 * Validate the combined zone rectangle against parent-relative boundary constraints.
 * Returns an error string or null.
 *
 * Note: overlap against existing zones is checked separately (see below) so this
 * function stays pure and testable without needing zone data.
 */
function validateZoneRect(x: number, y: number, w: number, h: number): string | null {
  if (x < 0 || x > 100) return "X must be between 0 and 100.";
  if (y < 0 || y > 100) return "Y must be between 0 and 100.";
  if (w < MIN_ZONE_SIZE_PCT) return `Width must be at least ${MIN_ZONE_SIZE_PCT}%.`;
  if (h < MIN_ZONE_SIZE_PCT) return `Height must be at least ${MIN_ZONE_SIZE_PCT}%.`;
  if (w > 100) return "Width must be 100% or less.";
  if (h > 100) return "Height must be 100% or less.";
  if (x + w > 100) return `Zone extends past the right edge of the building (X ${x} + Width ${w} = ${x + w} > 100).`;
  if (y + h > 100) return `Zone extends past the bottom edge of the building (Y ${y} + Height ${h} = ${y + h} > 100).`;
  return null;
}

/**
 * Find the first existing zone that the proposed rect overlaps.
 * Returns the overlapping zone or null if none.
 */
function findOverlappingZone(
  x: number, y: number, w: number, h: number,
  zones: FacilityZone[],
): FacilityZone | null {
  const proposed = { x, y, width: w, height: h };
  return zones.find((z) => rectanglesOverlap(proposed, z)) ?? null;
}

/** Tiny live preview: a 100×100 building box with the zone rectangle overlaid. */
function ZonePreview({ x, y, width, height, error }: {
  x: number; y: number; width: number; height: number; error: string | null;
}) {
  const px = Math.max(0, Math.min(100, x));
  const py = Math.max(0, Math.min(100, y));
  const pw = Math.max(0, Math.min(100 - px, width));
  const ph = Math.max(0, Math.min(100 - py, height));

  return (
    <div className="mt-3" data-testid="zone-preview">
      <p className="mb-1 text-xs text-gray-400">Preview (relative to building)</p>
      <div
        className="relative h-20 w-full overflow-hidden rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
        aria-label="Zone placement preview"
      >
        <div
          data-testid="zone-preview-rect"
          className={`absolute rounded-sm ${error ? "bg-red-400/40 border border-red-400" : "bg-brand-500/30 border border-brand-500"}`}
          style={{ left: `${px}%`, top: `${py}%`, width: `${pw}%`, height: `${ph}%` }}
        />
        <span className="absolute bottom-0.5 right-1 text-[9px] text-gray-300 dark:text-gray-600 select-none">100</span>
        <span className="absolute left-1 top-0.5 text-[9px] text-gray-300 dark:text-gray-600 select-none">0</span>
      </div>
    </div>
  );
}

/**
 * Add a zone inside a building. The zone's name must match a camera source's
 * `zone` field (with `site` matching the building's name) for that camera to
 * appear pinned inside it — see FacilityMapController::index().
 *
 * Validation:
 *  1. Boundary: x+width ≤ 100 and y+height ≤ 100 (zone stays inside building)
 *  2. Overlap: new zone must not overlap any existing zone in the same building
 */
export default function AddZoneModal({
  open, onClose, buildingId, buildingName, initialRect, existingZones = [],
}: Props) {
  const [name, setName]     = useState("");
  const [x, setX]           = useState(10);
  const [y, setY]           = useState(10);
  const [width, setWidth]   = useState(30);
  const [height, setHeight] = useState(30);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const { createZone } = useFacilityActions();
  const toast = useToast();

  // 1. Boundary validation (pure — no zone data needed)
  const boundaryError = useMemo(
    () => validateZoneRect(x, y, width, height),
    [x, y, width, height],
  );

  // 2. Overlap validation — only run when boundary is already valid
  const overlappingZone = useMemo(
    () => (boundaryError ? null : findOverlappingZone(x, y, width, height, existingZones)),
    [x, y, width, height, boundaryError, existingZones],
  );

  const overlapError = overlappingZone
    ? `This zone overlaps "${overlappingZone.name}". Each zone must occupy a distinct area.`
    : null;

  const validationError = boundaryError ?? overlapError;

  useEffect(() => {
    if (!open) return;
    if (initialRect) {
      setX(Math.round(initialRect.x));
      setY(Math.round(initialRect.y));
      setWidth(Math.max(MIN_ZONE_SIZE_PCT, Math.round(initialRect.width)));
      setHeight(Math.max(MIN_ZONE_SIZE_PCT, Math.round(initialRect.height)));
      setShowAdvanced(false);
    } else {
      setShowAdvanced(true);
    }
    setTimeout(() => nameRef.current?.focus(), 50);
  }, [open, initialRect]);

  const reset = () => {
    setName(""); setX(10); setY(10); setWidth(30); setHeight(30); setShowAdvanced(false);
  };

  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!buildingId || validationError) return;
    try {
      await createZone.mutateAsync({ buildingId, payload: { name, x, y, width, height } });
      toast.success(`${name} added to ${buildingName}.`);
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add zone.");
    }
  };

  const isSubmitDisabled = createZone.isPending || !name.trim() || !!validationError;

  // Field-level error highlighting helpers
  const rightOverflow  = x + width  > 100;
  const bottomOverflow = y + height > 100;

  return (
    <Modal isOpen={open} onClose={close} className="mx-4 w-full max-w-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Add Zone — {buildingName}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {initialRect
          ? "Zone position was captured from your drawing. Give it a name that matches the Zone field on your cameras so feeds pin here automatically."
          : "Name this zone to match the Zone field on your cameras (Site = building name) so feeds pin here automatically. Optionally adjust the position below."}
      </p>

      {/* Overlap warning shown even when advanced is collapsed, so the user understands why submit is blocked */}
      {overlapError && !showAdvanced && (
        <p
          role="alert"
          data-testid="overlap-warning-collapsed"
          className="mt-2 text-xs text-red-500 dark:text-red-400"
        >
          ⚠ {overlapError}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {/* Primary field */}
        <div>
          <label className="mb-1 block text-theme-xs text-gray-400">Zone name</label>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Entrance, Server Room, Loading Bay"
            className={fieldClass}
            onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitDisabled) void submit(); }}
          />
        </div>

        {/* Advanced toggle */}
        <div>
          <button
            type="button"
            data-testid="advanced-toggle"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
          >
            <svg
              className={`h-3 w-3 transition-transform duration-150 ${showAdvanced ? "rotate-90" : ""}`}
              viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="3,2 9,6 3,10" />
            </svg>
            Advanced position settings
            {!showAdvanced && (
              <span className="ml-1 text-gray-400/60">
                ({Math.round(x)}%, {Math.round(y)}%,&nbsp;{Math.round(width)}×{Math.round(height)})
              </span>
            )}
          </button>

          {showAdvanced && (
            <div className="mt-2 space-y-3" data-testid="advanced-fields">
              <p className="text-xs text-gray-400">
                Position and size are percentages within this building's bounding box (0–100).
                The right edge (X + Width) and bottom edge (Y + Height) must each be ≤ 100.
                Zones may not overlap each other.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-theme-xs text-gray-400">X position (%)</label>
                  <input
                    type="number" min={0} max={100} value={x}
                    onChange={(e) => setX(Number(e.target.value))}
                    className={(x < 0 || x > 100 || rightOverflow) ? fieldErrorClass : fieldClass}
                    data-testid="field-x"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-theme-xs text-gray-400">Y position (%)</label>
                  <input
                    type="number" min={0} max={100} value={y}
                    onChange={(e) => setY(Number(e.target.value))}
                    className={(y < 0 || y > 100 || bottomOverflow) ? fieldErrorClass : fieldClass}
                    data-testid="field-y"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-theme-xs text-gray-400">Width (%)</label>
                  <input
                    type="number" min={MIN_ZONE_SIZE_PCT} max={100} value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className={(width < MIN_ZONE_SIZE_PCT || width > 100 || rightOverflow) ? fieldErrorClass : fieldClass}
                    data-testid="field-width"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-theme-xs text-gray-400">Height (%)</label>
                  <input
                    type="number" min={MIN_ZONE_SIZE_PCT} max={100} value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className={(height < MIN_ZONE_SIZE_PCT || height > 100 || bottomOverflow) ? fieldErrorClass : fieldClass}
                    data-testid="field-height"
                  />
                </div>
              </div>

              {/* Validation errors */}
              {validationError && (
                <p role="alert" data-testid="validation-error" className="text-xs text-red-500 dark:text-red-400">
                  ⚠ {validationError}
                </p>
              )}

              {/* Live preview */}
              <ZonePreview x={x} y={y} width={width} height={height} error={validationError} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={close} disabled={createZone.isPending}>
          Cancel
        </Button>
        <Button
          size="sm" variant="primary"
          onClick={() => void submit()}
          disabled={isSubmitDisabled}
        >
          {createZone.isPending ? "Adding…" : "Add zone"}
        </Button>
      </div>
    </Modal>
  );
}
