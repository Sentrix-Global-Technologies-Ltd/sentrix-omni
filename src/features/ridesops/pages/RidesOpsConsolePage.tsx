import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import StatCard from "../../../components/shared/StatCard";
import Tabs from "../../../components/shared/Tabs";
import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import Button from "../../../components/ui/button/Button";
import Pagination from "../../../components/ui/pagination/Pagination";
import { DollarLineIcon, GroupIcon, PieChartIcon, TaskIcon } from "../../../icons";
import RideTable from "../components/RideTable";
import DriverTable from "../components/DriverTable";
import SurgeButton from "../components/SurgeButton";
import {
  DRIVER_AVAILABILITY_OPTIONS,
  DRIVER_STAGE_OPTIONS,
  RIDE_STATUS_OPTIONS,
  formatNaira,
} from "../components/ridesOpsTone";
import { useOpsDrivers, useOpsRides, useRidesOverview } from "../hooks/useRidesOps";

interface PaginatorMeta {
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

export default function RidesOpsConsolePage() {
  const [tab, setTab] = useState("rides");
  const [rideStatus, setRideStatus] = useState("");
  const [ridePage, setRidePage] = useState(1);
  const [stage, setStage] = useState("");
  const [availability, setAvailability] = useState("");
  const [driverPage, setDriverPage] = useState(1);

  const overview = useRidesOverview();
  const rides = useOpsRides({ status: rideStatus || undefined, page: ridePage });
  const drivers = useOpsDrivers({
    stage: stage || undefined,
    availability: availability || undefined,
    page: driverPage,
  });

  const o = overview.data?.data;
  const ridesMeta = rides.data?.meta as PaginatorMeta | undefined;
  const driversMeta = drivers.data?.meta as PaginatorMeta | undefined;
  const driverFiltered = Boolean(stage || availability);

  return (
    <>
      <PageMeta title="Rides-Ops | Sentrix Console" description="Ride marketplace operations" />
      <PageHeader
        title="Rides-Ops"
        breadcrumbs={[{ label: "SuperAdmin", to: "/superadmin" }, { label: "Rides-Ops" }]}
        actions={<SurgeButton />}
      />

      <div className="mb-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Active rides"
            tone="info"
            icon={<TaskIcon className="size-6" />}
            loading={overview.isLoading}
            value={o?.rides.active ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Drivers online"
            tone="success"
            icon={<GroupIcon className="size-6" />}
            loading={overview.isLoading}
            value={o?.drivers.online ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Revenue (completed)"
            tone="primary"
            icon={<DollarLineIcon className="size-6" />}
            loading={overview.isLoading}
            value={formatNaira(o?.revenue_cents)}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Cancel rate"
            tone="warning"
            icon={<PieChartIcon className="size-6" />}
            loading={overview.isLoading}
            value={`${o?.cancel_rate ?? 0}%`}
          />
        </div>
      </div>

      <Tabs
        tabs={[
          { key: "rides", label: "Rides" },
          { key: "drivers", label: "Drivers" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "rides" && (
        <>
          <FilterBar
            trailing={
              rideStatus ? (
                <Button size="sm" variant="outline" onClick={() => { setRideStatus(""); setRidePage(1); }}>
                  Clear
                </Button>
              ) : undefined
            }
          >
            <FilterSelect
              label="Status"
              value={rideStatus}
              options={RIDE_STATUS_OPTIONS}
              placeholder="All statuses"
              onChange={(v) => { setRideStatus(v); setRidePage(1); }}
            />
          </FilterBar>

          <RideTable
            rides={rides.data?.data ?? []}
            isLoading={rides.isLoading}
            error={rides.error}
            onRetry={() => void rides.refetch()}
          />

          {ridesMeta && (
            <Pagination
              currentPage={ridesMeta.current_page ?? 1}
              lastPage={ridesMeta.last_page ?? 1}
              total={ridesMeta.total}
              from={ridesMeta.from}
              to={ridesMeta.to}
              onPageChange={setRidePage}
            />
          )}
        </>
      )}

      {tab === "drivers" && (
        <>
          <FilterBar
            trailing={
              driverFiltered ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setStage(""); setAvailability(""); setDriverPage(1); }}
                >
                  Clear
                </Button>
              ) : undefined
            }
          >
            <FilterSelect
              label="Stage"
              value={stage}
              options={DRIVER_STAGE_OPTIONS}
              placeholder="All stages"
              onChange={(v) => { setStage(v); setDriverPage(1); }}
            />
            <FilterSelect
              label="Availability"
              value={availability}
              options={DRIVER_AVAILABILITY_OPTIONS}
              placeholder="All"
              onChange={(v) => { setAvailability(v); setDriverPage(1); }}
            />
          </FilterBar>

          <DriverTable
            drivers={drivers.data?.data ?? []}
            isLoading={drivers.isLoading}
            error={drivers.error}
            onRetry={() => void drivers.refetch()}
          />

          {driversMeta && (
            <Pagination
              currentPage={driversMeta.current_page ?? 1}
              lastPage={driversMeta.last_page ?? 1}
              total={driversMeta.total}
              from={driversMeta.from}
              to={driversMeta.to}
              onPageChange={setDriverPage}
            />
          )}
        </>
      )}
    </>
  );
}
