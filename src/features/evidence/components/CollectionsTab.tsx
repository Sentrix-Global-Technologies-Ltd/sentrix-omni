import { useState } from "react";
import Can from "../../../components/shared/Can";
import Button from "../../../components/ui/button/Button";
import Pagination from "../../../components/ui/pagination/Pagination";
import CollectionsTable from "./CollectionsTable";
import CreateCollectionModal from "./CreateCollectionModal";
import CollectionDetailModal from "./CollectionDetailModal";
import { useEvidenceCollections } from "../hooks/useEvidence";
import type { EvidenceCollection } from "../api/evidence.types";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

/** Evidence Collections (case files) tab — list + create + detail/manage. */
export default function CollectionsTab() {
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const query = useEvidenceCollections(page);
  const meta = query.data?.meta as PaginatorMeta | undefined;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Can permission="evidence.collections.manage">
          <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
            + New collection
          </Button>
        </Can>
      </div>

      <CollectionsTable
        collections={query.data?.data ?? []}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onOpen={(c: EvidenceCollection) => setOpenId(c.id)}
      />

      {meta && (
        <Pagination
          currentPage={meta.current_page ?? 1}
          lastPage={meta.last_page ?? 1}
          total={meta.total}
          from={meta.from}
          to={meta.to}
          onPageChange={setPage}
        />
      )}

      <CreateCollectionModal open={creating} onClose={() => setCreating(false)} />
      <CollectionDetailModal collectionId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
