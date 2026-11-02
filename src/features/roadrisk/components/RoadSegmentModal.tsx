import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Switch from "../../../components/form/switch/Switch";
import Can from "../../../components/shared/Can";
import { useToast } from "../../../components/shared/toast";
import { useCreateRoadSegment, useUpdateRoadSegment } from "../hooks/useRoadSegmentMutations";
import type { RoadSegment } from "../api/road-risk.types";
import { userMessage } from "../../../services/api/errors";

interface Props {
  /** null = create a new segment; a RoadSegment = editing that one. */
  segment: RoadSegment | null;
  /** Modal is only rendered while open — this distinguishes "closed" from "create mode". */
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Add/edit a curated road segment (center point + radius around a named
 * corridor — there is no ingested road-network dataset, see the backend
 * RoadRisk migration's docblock). Read-only for anyone who can only reach the
 * page via roadrisk.view; the save controls are gated on roadrisk.manage
 * (mirrors TriageTicketModal's Can nesting).
 */
export default function RoadSegmentModal({ segment, isOpen, onClose }: Props) {
  const isEditing = segment !== null;
  const toast = useToast();
  const create = useCreateRoadSegment();
  const update = useUpdateRoadSegment();
  const saving = create.isPending || update.isPending;

  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radiusM, setRadiusM] = useState("2000");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setName(segment?.name ?? "");
    setArea(segment?.area ?? "");
    setLat(segment ? String(segment.location.lat) : "");
    setLng(segment ? String(segment.location.lng) : "");
    setRadiusM(segment ? String(segment.radius_m) : "2000");
    setActive(segment?.active ?? true);
  }, [segment, isOpen]);

  if (!isOpen) return null;

  const save = async () => {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusNum = Number(radiusM);

    if (!name.trim() || Number.isNaN(latNum) || Number.isNaN(lngNum) || Number.isNaN(radiusNum)) {
      toast.error("Name, latitude, longitude, and radius are required.");
      return;
    }

    try {
      if (isEditing) {
        await update.mutateAsync({
          id: segment.id,
          payload: { name, area: area || null, lat: latNum, lng: lngNum, radius_m: radiusNum, active },
        });
        toast.success("Segment updated.");
      } else {
        await create.mutateAsync({ name, area: area || null, lat: latNum, lng: lngNum, radius_m: radiusNum });
        toast.success("Segment added — it will be scored on the next scheduled sweep.");
      }
      onClose();
    } catch (e) {
      toast.error(userMessage(e, "Could not save the segment."));
    }
  };

  return (
    <Modal isOpen onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {isEditing ? segment.name : "Add road segment"}
      </h3>
      <p className="mt-1 text-theme-xs text-gray-400">
        A named corridor — center point + radius. Scored from real nearby community-alert history on a schedule.
      </p>

      <Can
        permission="roadrisk.manage"
        fallback={
          <>
            <p className="mt-4 text-theme-xs text-gray-400">
              You can view this segment but do not have permission to edit it.
            </p>
            <div className="mt-6 flex justify-end">
              <Button size="sm" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        }
      >
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Third Mainland Bridge" />
          </div>
          <div>
            <Label>Area</Label>
            <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Lagos Mainland / Lagos Island" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Latitude</Label>
              <Input type="number" step={0.0001} value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input type="number" step={0.0001} value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Radius (metres)</Label>
            <Input type="number" step={100} value={radiusM} onChange={(e) => setRadiusM(e.target.value)} />
          </div>
          {isEditing ? (
            <Switch key={segment.id} label="Active" defaultChecked={active} onChange={setActive} />
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </Can>
    </Modal>
  );
}
