import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useObservationActions } from "../hooks/useEvidenceActions";
import type { Observation } from "../api/evidence.types";

interface Props {
  observation: Observation;
  /** Opens the chain-of-custody viewer for this observation (see CustodyModal). */
  onViewCustody?: (observation: Observation) => void;
}

/** Per-row observation actions: hold/release (evidence.hold) + bookmark toggle
 * + a read-only "Custody" trail viewer (evidence.view — same tier as the vault). */
export default function ObservationActions({ observation, onViewCustody }: Props) {
  const a = useObservationActions(observation.id);

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {onViewCustody && (
        <Button size="sm" variant="outline" onClick={() => onViewCustody(observation)}>
          Custody
        </Button>
      )}
      <Can permission="evidence.view">
        <ConfirmActionButton
          label={observation.bookmarked ? "Unbookmark" : "Bookmark"}
          title={observation.bookmarked ? "Remove bookmark?" : "Bookmark observation?"}
          description={
            observation.bookmarked
              ? "Remove this observation from your bookmarks."
              : "Bookmark this observation for quick reference."
          }
          confirmLabel={observation.bookmarked ? "Unbookmark" : "Bookmark"}
          successMessage={observation.bookmarked ? "Bookmark removed" : "Observation bookmarked"}
          onConfirm={() => a.bookmark.mutateAsync(!observation.bookmarked)}
        />
      </Can>
      <Can permission="evidence.hold">
        <ConfirmActionButton
          label={observation.hold ? "Release hold" : "Legal hold"}
          tone={observation.hold ? "primary" : "danger"}
          title={observation.hold ? "Release legal hold?" : "Place on legal hold?"}
          description={
            observation.hold
              ? "Release this observation from legal hold; normal retention resumes."
              : "Place this observation on legal hold so it is preserved beyond its retention tier."
          }
          confirmLabel={observation.hold ? "Release" : "Place hold"}
          successMessage={observation.hold ? "Hold released" : "Placed on legal hold"}
          onConfirm={() => a.hold.mutateAsync(!observation.hold)}
        />
      </Can>
    </div>
  );
}
