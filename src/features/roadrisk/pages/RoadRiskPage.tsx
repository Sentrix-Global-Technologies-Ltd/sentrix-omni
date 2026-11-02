import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import FilterText from "../../../components/shared/FilterText";
import Pagination from "../../../components/ui/pagination/Pagination";
import Can from "../../../components/shared/Can";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { ROAD_RISK_ACTIVE_OPTIONS, ROAD_RISK_BAND_OPTIONS } from "../components/roadRiskTone";
import RoadRiskTable from "../components/RoadRiskTable";
import RoadSegmentModal from "../components/RoadSegmentModal";
import { useRoadRiskSegments } from "../hooks/useRoadRiskSegments";
import { useRecomputeRoadSegment } from "../hooks/useRoadSegmentMutations";
import type { RoadSegment } from "../api/road-risk.types";
import { userMessage } from "../../../services/api/errors";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

/**
 * Sentrix Console (platform-staff) — curates the road-segment safety scoring
 * feed powering the consumer app's Road Risk screen. Gated on roadrisk.view;
 * write actions (add/edit a segment, trigger a recompute) are separately
 * gated on roadrisk.manage (see RoadSegmentModal / RoadRiskTable).
 */
export default function RoadRiskPage() {
  const toast = useToast();
  const [active, setActive] = useState("");
  const [band, setBand] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<RoadSegment | null>(null);
  const [modalMode, setModalMode] = useState<"none" | "create" | "edit">("none");

  const query = useRoadRiskSegments({
    active: active === "" ? undefined : active === "true",
    band,
    search,
    page,
  });
  const recompute = useRecomputeRoadSegment();
  const meta = query.data?.meta as PaginatorMeta | undefined;

  const openEdit = (segment: RoadSegment) => {
    setSelected(segment);
    setModalMode("edit");
  };

  const runRecompute = async (segment: RoadSegment) => {
    try {
      await recompute.mutateAsync(segment.id);
      toast.success(`${segment.name} rescored.`);
    } catch (e) {
      toast.error(userMessage(e, "Sentrix Core is unreachable right now — try again shortly."));
    }
  };

  return (
    <>
      <PageMeta title="Road Risk | Sentrix Console" description="Curated road-segment safety scoring feed" />
      <PageHeader
        title="Road Risk"
        breadcrumbs={[{ label: "SuperAdmin", to: "/superadmin" }, { label: "Road Risk" }]}
      />

      <Can
        permission="roadrisk.view"
        fallback={<p className="text-theme-sm text-gray-400">You do not have permission to view road-risk segments.</p>}
      >
        <FilterBar
          trailing={
            <div className="flex items-center gap-3">
              {(active || band || search) && (
                <button
                  onClick={() => {
                    setActive("");
                    setBand("");
                    setSearch("");
                    setPage(1);
                  }}
                  className="text-theme-sm font-medium text-brand-500 hover:underline"
                >
                  Clear filters
                </button>
              )}
              <Can permission="roadrisk.manage">
                <Button size="sm" variant="primary" onClick={() => setModalMode("create")}>
                  Add segment
                </Button>
              </Can>
            </div>
          }
        >
          <FilterText
            label="Search"
            value={search}
            placeholder="Segment name"
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <FilterSelect
            label="Band"
            value={band}
            options={ROAD_RISK_BAND_OPTIONS}
            onChange={(v) => {
              setBand(v);
              setPage(1);
            }}
          />
          <FilterSelect
            label="Status"
            value={active}
            options={ROAD_RISK_ACTIVE_OPTIONS}
            onChange={(v) => {
              setActive(v);
              setPage(1);
            }}
          />
        </FilterBar>

        <RoadRiskTable
          segments={query.data?.data ?? []}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
          onRowClick={openEdit}
          onRecompute={(s) => void runRecompute(s)}
          recomputingId={recompute.isPending ? recompute.variables ?? null : null}
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

        <RoadSegmentModal
          segment={modalMode === "edit" ? selected : null}
          isOpen={modalMode !== "none"}
          onClose={() => setModalMode("none")}
        />
      </Can>
    </>
  );
}
