import Button from "../button/Button";

/** Cursor (keyset) paginator meta as returned by Laravel's CursorPaginator. */
export interface CursorMeta {
  next_cursor?: string | null;
  prev_cursor?: string | null;
}

interface CursorPaginationProps {
  meta?: CursorMeta;
  onCursor: (cursor: string | null) => void;
}

/**
 * Prev/Next control for cursor-paginated endpoints. Lists are newest-first, so
 * "Newer" walks the previous cursor and "Older" the next. There is no total or
 * page number by design (keyset pagination is COUNT-free).
 */
export default function CursorPagination({ meta, onCursor }: CursorPaginationProps) {
  const prev = meta?.prev_cursor ?? null;
  const next = meta?.next_cursor ?? null;

  if (!prev && !next) return null;

  return (
    <div className="flex items-center justify-end gap-2 px-1 py-3">
      <Button size="sm" variant="outline" disabled={!prev} onClick={() => onCursor(prev)}>
        ← Newer
      </Button>
      <Button size="sm" variant="outline" disabled={!next} onClick={() => onCursor(next)}>
        Older →
      </Button>
    </div>
  );
}
