import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { titleCase } from "./evidenceTone";
import { useEvidenceCollection, useEvidenceSearch } from "../hooks/useEvidence";
import { useEvidenceCollectionActions } from "../hooks/useEvidenceActions";

const fieldClass =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

interface Props {
  collectionId: string | null;
  onClose: () => void;
  onDeleted?: () => void;
}

/** Collection detail: member observations + an inline picker to add more from
 * a live label/plate search. Removing a member never touches the underlying
 * Observation — only the collection's membership. */
export default function CollectionDetailModal({ collectionId, onClose, onDeleted }: Props) {
  const [addQuery, setAddQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const { addObservations, removeObservations, remove } = useEvidenceCollectionActions();
  const toast = useToast();

  const detail = useEvidenceCollection(collectionId);
  const search = useEvidenceSearch(showAdd ? { q: addQuery || undefined } : {});

  const c = detail.data?.data;
  const memberIds = new Set((c?.observations ?? []).map((o) => o.id));

  const addOne = async (observationId: string) => {
    if (!collectionId) return;
    try {
      await addObservations.mutateAsync({ id: collectionId, observationIds: [observationId] });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not add the observation.");
    }
  };

  const removeOne = async (observationId: string) => {
    if (!collectionId) return;
    await removeObservations.mutateAsync({ id: collectionId, observationIds: [observationId] });
  };

  const deleteCollection = async () => {
    if (!collectionId) return;
    await remove.mutateAsync(collectionId);
    onDeleted?.();
    onClose();
  };

  return (
    <Modal isOpen={Boolean(collectionId)} onClose={onClose} className="mx-4 w-full max-w-2xl p-6">
      {!c ? (
        <p className="text-theme-sm text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{c.name}</h3>
              {c.description && (
                <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{c.description}</p>
              )}
              <p className="mt-1 text-theme-xs text-gray-400">
                {c.observations?.length ?? 0} observation{(c.observations?.length ?? 0) === 1 ? "" : "s"}
                {c.creator_name ? ` · created by ${c.creator_name}` : ""}
              </p>
            </div>
            <Can permission="evidence.collections.manage">
              <ConfirmActionButton
                label="Delete"
                tone="danger"
                title="Delete this collection?"
                description="This removes the case-file grouping only — the observations themselves are never deleted."
                confirmLabel="Delete"
                onConfirm={deleteCollection}
              />
            </Can>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-theme-sm font-medium text-gray-700 dark:text-gray-200">Observations</h4>
              <Can permission="evidence.collections.manage">
                <Button size="sm" variant="outline" onClick={() => setShowAdd((v) => !v)}>
                  {showAdd ? "Close" : "+ Add observations"}
                </Button>
              </Can>
            </div>

            {showAdd && (
              <div className="mt-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <input
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                  placeholder="Search by label or plate…"
                  className={fieldClass}
                />
                <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                  {(search.data?.data ?? []).map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <span className="truncate text-theme-sm text-gray-700 dark:text-gray-300">
                        {o.label ?? titleCase(o.kind)}
                        {o.plate ? ` — ${o.plate}` : ""}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={memberIds.has(o.id) || addObservations.isPending}
                        onClick={() => void addOne(o.id)}
                      >
                        {memberIds.has(o.id) ? "Added" : "Add"}
                      </Button>
                    </div>
                  ))}
                  {search.data?.data?.length === 0 && (
                    <p className="px-2 py-1.5 text-theme-xs text-gray-400">No observations found.</p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
              {(c.observations ?? []).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
                >
                  <span className="truncate text-theme-sm text-gray-700 dark:text-gray-300">
                    {o.label ?? titleCase(o.kind)}
                    {o.plate ? ` — ${o.plate}` : ""}
                  </span>
                  <Can permission="evidence.collections.manage">
                    <Button size="sm" variant="outline" onClick={() => void removeOne(o.id)}>
                      Remove
                    </Button>
                  </Can>
                </div>
              ))}
              {(c.observations ?? []).length === 0 && (
                <p className="py-2 text-theme-sm text-gray-400">No observations in this collection yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
