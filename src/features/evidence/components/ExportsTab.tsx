import { useState } from "react";
import CursorPagination, { type CursorMeta } from "../../../components/ui/pagination/CursorPagination";
import ExportsTable from "./ExportsTable";
import { useRetentionExports } from "../../retention/hooks/useRetention";

/** Exports tab — append-only archive manifest history (see RetentionService::archive). */
export default function ExportsTab() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const query = useRetentionExports(cursor);
  const meta = query.data?.meta as CursorMeta | undefined;

  return (
    <>
      <ExportsTable
        exports={query.data?.data ?? []}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
      />
      <CursorPagination meta={meta} onCursor={(c) => setCursor(c ?? undefined)} />
    </>
  );
}
