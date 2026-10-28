import { useState, useMemo } from "react";
import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import DeviceActions from "./DeviceActions";
import { deviceStatusTone, humanize, relativeTime, titleCase } from "./deviceTone";
import { DEVICE_KINDS } from "../api/hardware.types";
import type { Device } from "../api/hardware.types";

interface Props {
  devices: Device[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Device fleet table with client-side search and kind filter. */
export default function DeviceTable({ devices, isLoading, error, onRetry }: Props) {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("");

  // Client-side filter: text search across name, serial, site, zone, kind;
  // kind dropdown filter.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return devices.filter((d) => {
      if (kindFilter && d.kind !== kindFilter) return false;
      if (!q) return true;
      return (
        (d.name ?? "").toLowerCase().includes(q) ||
        d.serial.toLowerCase().includes(q) ||
        (d.site ?? "").toLowerCase().includes(q) ||
        (d.zone ?? "").toLowerCase().includes(q) ||
        humanize(d.kind).toLowerCase().includes(q)
      );
    });
  }, [devices, search, kindFilter]);

  const columns: Column<Device>[] = [
    {
      key: "device",
      header: "Device",
      render: (d) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{d.name ?? d.serial}</p>
          <p className="mt-0.5 font-mono text-theme-xs text-gray-400">{d.serial}</p>
        </div>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      render: (d) => <span className="text-gray-600 dark:text-gray-300">{humanize(d.kind)}</span>,
    },
    {
      key: "location",
      header: "Location",
      render: (d) => (
        <span className="text-gray-600 dark:text-gray-300">
          {[d.site, d.zone].filter(Boolean).join(" · ") || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (d) => <StatusBadge tone={deviceStatusTone(d.status)}>{titleCase(d.status)}</StatusBadge>,
    },
    {
      key: "last_seen",
      header: "Last seen",
      render: (d) => (
        <span className="text-gray-500 dark:text-gray-400">{relativeTime(d.last_seen_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center",
      className: "text-center",
      render: (d) => <DeviceActions device={d} />,
    },
  ];

  return (
    <div>
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            placeholder="Search devices…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none ring-0 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder-gray-500 dark:focus:border-brand-400"
          />
        </div>

        {/* Kind filter */}
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          aria-label="Filter by kind"
        >
          <option value="">All types</option>
          {DEVICE_KINDS.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>

        {/* Result count */}
        {(search || kindFilter) && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {filtered.length !== devices.length && ` of ${devices.length}`}
          </span>
        )}

        {/* Clear filters */}
        {(search || kindFilter) && (
          <button
            type="button"
            onClick={() => { setSearch(""); setKindFilter(""); }}
            className="text-xs text-brand-600 hover:underline dark:text-brand-400"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        emptyTitle={search || kindFilter ? "No matching devices" : "No devices"}
        emptyDescription={
          search || kindFilter
            ? "Try adjusting your search or filter."
            : "No hardware devices are registered for this organization."
        }
      />
    </div>
  );
}
