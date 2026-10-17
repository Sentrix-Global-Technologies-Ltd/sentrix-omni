import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import Button from "../../../components/ui/button/Button";
import ListToolbar from "../../../components/shared/ListToolbar";
import ListPagination from "../../../components/shared/ListPagination";
import Can from "../../../components/shared/Can";
import TripTable from "../components/TripTable";
import CreateTripButton from "../components/CreateTripButton";
import { TRIP_STATUS_OPTIONS } from "../components/tripTone";
import { useTrips } from "../hooks/useTrips";
import type { Trip, TripFilters } from "../api/trips.types";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

const DEFAULT_PAGE_SIZE = 25;

export default function TripListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filters: TripFilters = {
    status:   params.get("status")   ?? undefined,
    page:     params.get("page")     ? Number(params.get("page")) : undefined,
    per_page: params.get("per_page") ? Number(params.get("per_page")) : DEFAULT_PAGE_SIZE,
  };

  const query = useTrips(filters);
  const trips = query.data?.data ?? [];
  const meta = query.data?.meta as PaginatorMeta | undefined;

  // ── Client-side search over current page ──────────────────────────────────
  const [search, setSearch] = useState("");
  const visible = useMemo<Trip[]>(() => {
    if (!search.trim()) return trips;
    const q = search.toLowerCase();
    return trips.filter(
      (t) =>
        (t.origin?.label ?? "").toLowerCase().includes(q) ||
        (t.destination?.label ?? "").toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.notes ?? "").toLowerCase().includes(q),
    );
  }, [trips, search]);

  // ── Filter / page helpers ─────────────────────────────────────────────────
  const updateFilters = useCallback((next: Partial<TripFilters>) => {
    setSearch("");
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.status) sp.set("status", merged.status);
    if (merged.per_page && merged.per_page !== DEFAULT_PAGE_SIZE)
      sp.set("per_page", String(merged.per_page));
    if (next.page !== undefined) sp.set("page", String(next.page));
    setParams(sp);
  }, [filters, setParams]);

  const clear = useCallback(() => { setSearch(""); setParams(new URLSearchParams()); }, [setParams]);

  const setPage = useCallback((page: number) => updateFilters({ page }), [updateFilters]);

  const setPageSize = useCallback(
    (size: number) => updateFilters({ per_page: size, page: undefined }),
    [updateFilters],
  );

  return (
    <>
      <PageMeta title="Trips | Sentrix Console" description="Safety journeys" />
      <PageHeader
        title="Trips"
        breadcrumbs={[{ label: "Trips" }]}
        actions={
          <Can permission="trips.create">
            <CreateTripButton />
          </Can>
        }
      />

      <div className="flex flex-col gap-4 pb-6">
        <FilterBar
          trailing={
            filters.status ? (
              <Button size="sm" variant="outline" onClick={clear}>
                Clear
              </Button>
            ) : undefined
          }
        >
          <FilterSelect
            label="Status"
            value={filters.status ?? ""}
            options={TRIP_STATUS_OPTIONS}
            placeholder="All statuses"
            onChange={(v) => updateFilters({ status: v || undefined })}
          />
        </FilterBar>

        <ListToolbar
          search={search}
          onSearch={setSearch}
          visibleCount={visible.length}
          totalCount={meta?.total ?? null}
          isLoading={query.isLoading}
          pageSize={filters.per_page ?? DEFAULT_PAGE_SIZE}
          onPageSizeChange={setPageSize}
          onRefresh={() => void query.refetch()}
          placeholder="Search trips…"
          refreshLabel="Refresh trips"
        />

        <TripTable
          trips={visible}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
          onRowClick={(t: Trip) => navigate(`/trips/${t.id}`)}
        />

        {meta && !query.isLoading && (
          <ListPagination
            currentPage={meta.current_page ?? 1}
            lastPage={meta.last_page ?? 1}
            total={meta.total}
            from={meta.from}
            to={meta.to}
            onPageChange={setPage}
          />
        )}
      </div>
    </>
  );
}
