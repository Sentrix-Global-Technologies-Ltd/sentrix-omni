import { useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import Button from "../../../components/ui/button/Button";
import Pagination from "../../../components/ui/pagination/Pagination";
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

export default function TripListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filters: TripFilters = {
    status: params.get("status") ?? undefined,
    page: params.get("page") ? Number(params.get("page")) : undefined,
  };

  const query = useTrips(filters);
  const meta = query.data?.meta as PaginatorMeta | undefined;

  const update = (next: Partial<TripFilters>) => {
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.status) sp.set("status", merged.status);
    setParams(sp);
  };
  const setPage = (page: number) => {
    const sp = new URLSearchParams(params);
    sp.set("page", String(page));
    setParams(sp);
  };

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

      <FilterBar
        trailing={
          filters.status ? (
            <Button size="sm" variant="outline" onClick={() => setParams(new URLSearchParams())}>
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
          onChange={(v) => update({ status: v || undefined })}
        />
      </FilterBar>

      <TripTable
        trips={query.data?.data ?? []}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onRowClick={(t: Trip) => navigate(`/trips/${t.id}`)}
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
    </>
  );
}
