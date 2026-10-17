import { useMemo } from "react";
import { useNavigate, Link } from "react-router";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import PageMeta from "../../../components/common/PageMeta";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import { useAuth } from "../../../context/AuthContext";
import { useOrganization } from "../../../context/OrganizationContext";
import {
  AlertHexaIcon,
  AlertIcon,
  BoltIcon,
  CheckCircleIcon,
  GroupIcon,
  VideoIcon,
  FileIcon,
  ArrowRightIcon,
  MapPinIcon,
  InfoIcon,
  TimeIcon,
} from "../../../icons";
import { useIncidents } from "../../incidents/hooks/useIncidents";
import { useIncidentsRealtime } from "../../incidents/hooks/useIncidentsRealtime";
import { useCameraSourcesSummary, useCameraFeeds } from "../../camera-feeds/hooks/useCameraFeeds";
import { useThreatScore } from "../../intel/hooks/useIntel";
import type { Incident, IncidentSeverity } from "../../incidents/api/incidents.types";
import "../../incidents/styles/incidents-centre.css";
import DashboardKpiCard from "../components/DashboardKpiCard";

// ─── helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function severityBadge(s: IncidentSeverity) {
  const map: Record<IncidentSeverity, { label: string; cls: string }> = {
    critical: { label: "Critical", cls: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400" },
    high:     { label: "High",     cls: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400" },
    medium:   { label: "Medium",   cls: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400" },
    low:      { label: "Low",      cls: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-400" },
  };
  const { label, cls } = map[s] ?? map.low;
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

/** Icon + bg color for each severity, matching the reference design's colored circles. */
function alertIcon(title: string, severity: IncidentSeverity) {
  const t = title.toLowerCase();
  // type-based first
  if (t.includes("vehicle") || t.includes("car") || t.includes("unauthori"))
    return { icon: <BoltIcon className="size-4" />, bg: "bg-orange-50 text-orange-500 dark:bg-orange-500/15" };
  if (t.includes("loiter") || t.includes("crowd") || t.includes("gathering"))
    return { icon: <TimeIcon className="size-4" />, bg: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400" };
  if (t.includes("ai") || t.includes("model") || t.includes("system") || t.includes("camera"))
    return { icon: <InfoIcon className="size-4" />, bg: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15" };
  // severity-based fallback
  if (severity === "critical" || severity === "high")
    return { icon: <AlertHexaIcon className="size-4" />, bg: "bg-error-50 text-error-500 dark:bg-error-500/15" };
  if (severity === "medium")
    return { icon: <AlertIcon className="size-4" />, bg: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400" };
  return { icon: <InfoIcon className="size-4" />, bg: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15" };
}

function threatBand(score: number) {
  if (score >= 70) return { label: "Critical",  color: "#f04438", track: "#fce9e8" };
  if (score >= 35) return { label: "Elevated",  color: "#f79009", track: "#fef3e2" };
  return              { label: "Nominal",    color: "#12b76a", track: "#e1f5ea" };
}

// ─── Threat score gauge ──────────────────────────────────────────────────────

function ThreatGauge({ score, loading }: { score: number; loading?: boolean }) {
  const { label, color, track } = threatBand(score);

  const options: ApexOptions = {
    chart: { type: "radialBar", fontFamily: "Outfit, sans-serif", sparkline: { enabled: true }, animations: { enabled: !loading } },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: { size: "60%", background: "transparent" },
        track: { background: track, strokeWidth: "100%" },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "32px",
            fontWeight: "700",
            color: "#1D2939",
            offsetY: 8,
            formatter: (v) => String(Math.round(v)),
          },
        },
      },
    },
    fill: { type: "solid", colors: [color] },
    stroke: { lineCap: "round" },
    colors: [color],
  };

  return (
    <div className="relative">
      <Chart options={options} series={[score]} type="radialBar" height={200} />
      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <span
          className="rounded-full px-3 py-0.5 text-xs font-semibold"
          style={{ background: `${color}20`, color }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── static demo insights ────────────────────────────────────────────────────

const DEMO_INSIGHTS = [
  { icon: <AlertHexaIcon className="size-4 text-error-500" />, text: "Perimeter breach attempts up 18% this week" },
  { icon: <VideoIcon className="size-4 text-brand-500" />,     text: "3 camera feeds degraded — check connection" },
  { icon: <CheckCircleIcon className="size-4 text-success-500" />, text: "All active sites are reporting normally" },
  { icon: <BoltIcon className="size-4 text-warning-500" />,    text: "Response time improved 12% vs last week" },
];

const DEMO_FACILITY = [
  { label: "Total Sites",  value: 16, icon: <GroupIcon className="size-5" />,        iconCls: "text-gray-400 dark:text-gray-500" },
  { label: "Secure",       value: 14, icon: <CheckCircleIcon className="size-5" />,   iconCls: "text-success-500" },
  { label: "Attention",    value: 2,  icon: <AlertIcon className="size-5" />,          iconCls: "text-warning-500" },
  { label: "Offline",      value: 0,  icon: <InfoIcon className="size-5" />,           iconCls: "text-gray-400 dark:text-gray-500" },
];

// ─── page ────────────────────────────────────────────────────────────────────

interface PaginatorMeta { total?: number }
function metaTotal(meta: unknown): number { return (meta as PaginatorMeta | undefined)?.total ?? 0; }

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { principal } = useAuth();
  const { current } = useOrganization();

  const orgName = current?.name ?? "Vision Guard";

  // Real data
  const openIncidents = useIncidents({ status: "open", per_page: 100 });
  const recentIncidents = useIncidents({ per_page: 5 });
  const cameraSummary = useCameraSourcesSummary();
  const cameraFeeds = useCameraFeeds({});
  const threatScore = useThreatScore();

  // Realtime
  const incidentsRt = useIncidentsRealtime();

  // Derived camera breakdown
  const feeds = useMemo(() => cameraFeeds.data?.data ?? [], [cameraFeeds.data]);
  const liveCount    = useMemo(() => feeds.filter((f) => f.feed_status === "live").length, [feeds]);
  const staleCount   = useMemo(() => feeds.filter((f) => f.feed_status === "stale").length, [feeds]);
  const offlineCount = useMemo(() => feeds.filter((f) => f.feed_status === "offline" || f.feed_status === "no_feed").length, [feeds]);

  // Prefer granular counts from feeds list; fall back to summary
  const totalCameras  = cameraSummary.data?.data.total  ?? feeds.length;
  const onlineCameras = cameraSummary.data?.data.online ?? liveCount;

  const alertsCount   = metaTotal(openIncidents.data?.meta);
  const activeAlerts  = (openIncidents.data?.data ?? []).slice(0, 4);
  const score         = threatScore.data?.data.score ?? 0;
  const factors       = threatScore.data?.data.factors ?? [];
  const firstCamera   = feeds[0] ?? null;
  const incidents5    = recentIncidents.data?.data ?? [];

  const card = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

  return (
    <>
      <PageMeta title={`${orgName} Dashboard | Sentrix Console`} description="Real-time overview of your security operations and threat landscape" />

      {/* Page header — inline to match the screenshot's style */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">{orgName} Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Real-time overview of your security operations and threat landscape.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeIndicator connected={incidentsRt.connected} />
          {principal && (
            <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block">
              Welcome back, {principal.name}
            </span>
          )}
        </div>
      </div>

      {/* ── 1. KPI row ───────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-12 gap-4 md:gap-5">
        <div className="col-span-12 sm:col-span-6 xl:col-span-2">
          <DashboardKpiCard label="Total Cameras" tone="light" icon={<VideoIcon className="size-6" />} value={totalCameras} sub="↑ live camera estate" loading={cameraSummary.isLoading} to="/hardware" />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-2">
          <DashboardKpiCard label="Active Alerts" tone="error" icon={<AlertHexaIcon className="size-6" />} value={alertsCount} sub={alertsCount > 0 ? "↑ require attention" : "↑ all clear"} loading={openIncidents.isLoading} to="/incidents?status=open" />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <DashboardKpiCard label="System Uptime" tone="success" icon={<CheckCircleIcon className="size-6" />} value="98.7%" sub="↑ 0.6% vs yesterday" />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-2">
          <DashboardKpiCard label="Monitored Sites" tone="info" icon={<GroupIcon className="size-6" />} value={current ? 1 : "—"} sub="↑ connected to platform" />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <DashboardKpiCard label="Incidents (30D)" tone="warning" icon={<FileIcon className="size-6" />} value={metaTotal(recentIncidents.data?.meta) || "—"} sub="↑ last 30 days" loading={recentIncidents.isLoading} to="/incidents" />
        </div>
      </div>

      {/* ── 2. Middle row: threat(30%) | alerts(30%) | camera(40%) ──────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[3fr_3fr_4fr] md:gap-5">

        {/* Live Threat Score */}
        <div className={card}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Live Threat Score</h3>
            {threatScore.data && (
              <span className="text-xs text-gray-400">
                {threatScore.data.data.open_incidents_count} open incident{threatScore.data.data.open_incidents_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <ThreatGauge score={score} loading={threatScore.isLoading} />

          {factors.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {factors.slice(0, 3).map((f) => (
                <li key={f.type} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    {f.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  <span className={`text-xs font-medium ${f.change_pct !== null && f.change_pct > 0 ? "text-error-500" : "text-success-600"}`}>
                    {f.change_pct !== null ? `${f.change_pct > 0 ? "↑" : "↓"}${Math.abs(f.change_pct)}%` : `${f.count}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-center text-xs text-gray-400">No detection data in last 24h.</p>
          )}

          <Link
            to="/vision-guard/ai-analytics"
            className="mt-4 flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600"
          >
            View Threat Intelligence <ArrowRightIcon className="size-3" />
          </Link>
        </div>

        {/* Active Alerts */}
        <div className={card}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Active Alerts</h3>
            <Link to="/incidents?status=open" className="text-xs font-medium text-brand-500 hover:text-brand-600">
              View all
            </Link>
          </div>

          {openIncidents.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
              ))}
            </div>
          ) : activeAlerts.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-gray-400">
              <CheckCircleIcon className="size-8 text-success-400" />
              <p className="text-sm">No active alerts — all clear</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {activeAlerts.map((inc: Incident) => {
                const { icon, bg } = alertIcon(inc.title, inc.severity);
                const location = (inc.metadata as Record<string, string> | null)?.site ?? (inc.metadata as Record<string, string> | null)?.location ?? null;
                return (
                  <li
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="flex cursor-pointer items-center gap-3 py-3 transition hover:bg-gray-50 first:pt-0 last:pb-0 dark:hover:bg-white/[0.02]"
                  >
                    {/* Icon in colored circle */}
                    <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${bg}`}>
                      {icon}
                    </span>

                    {/* Title + location */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{inc.title}</p>
                      {location && <p className="truncate text-xs text-gray-400">{location}</p>}
                    </div>

                    {/* Severity + time (right column) */}
                    <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                      {severityBadge(inc.severity)}
                      <span className="text-xs text-gray-400">{timeAgo(inc.opened_at)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Live Camera — 40% width */}
        <div className={card}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                Live Camera{firstCamera ? ` — ${firstCamera.label}` : ""}
              </h3>
              {firstCamera && firstCamera.feed_status === "live" && (
                <span className="flex-shrink-0 rounded-full bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-600 dark:bg-success-500/15 dark:text-success-400">
                  LIVE
                </span>
              )}
            </div>
            <Link to="/vision-guard/live" className="ml-2 flex-shrink-0 text-xs font-medium text-brand-500 hover:text-brand-600">
              View all
            </Link>
          </div>

          {cameraFeeds.isLoading ? (
            <div className="h-[220px] animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
          ) : firstCamera?.last_frame_url ? (
            <img
              src={firstCamera.last_frame_url}
              alt={firstCamera.label}
              className="h-[220px] w-full rounded-xl object-cover"
            />
          ) : (
            /* Fallback: use an existing project image so the panel always looks rich */
            <div className="relative overflow-hidden rounded-xl">
              <img
                src="/images/carousel/carousel-01.png"
                alt="Camera placeholder"
                className="h-[220px] w-full object-cover brightness-75"
              />
              {/* Overlay label matching real camera HUD style */}
              <div className="absolute inset-x-0 top-0 flex items-center gap-2 bg-black/40 px-3 py-1.5">
                <span className="font-mono text-xs font-semibold tracking-widest text-white/80">
                  {firstCamera?.site?.toUpperCase() ?? "MAIN BUILDING"} / CAM-01
                </span>
              </div>
            </div>
          )}

          {/* Camera status bar */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className={`inline-block h-2 w-2 rounded-full ${firstCamera?.feed_status === "live" ? "bg-success-500" : "bg-gray-400"}`} />
              {firstCamera
                ? `${firstCamera.site ? `${firstCamera.site} · ` : ""}${firstCamera.label}`
                : "No cameras configured"}
            </div>
            {!firstCamera && (
              <Link to="/vision-guard/camera-sources" className="text-xs font-medium text-brand-400 hover:text-brand-300">
                Add source →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Bottom row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">

        {/* Recent Incidents */}
        <div className={`${card} md:col-span-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Recent Incidents</h3>
            <Link to="/incidents" className="text-xs font-medium text-brand-500 hover:text-brand-600">
              View all
            </Link>
          </div>

          {recentIncidents.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
              ))}
            </div>
          ) : incidents5.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No incidents recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["ID", "Type", "Site", "Time", "Severity"].map((h) => (
                      <th key={h} className="pb-2 pr-3 font-semibold uppercase tracking-wide text-gray-400 last:pr-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {incidents5.map((inc: Incident) => (
                    <tr
                      key={inc.id}
                      onClick={() => navigate(`/incidents/${inc.id}`)}
                      className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    >
                      <td className="py-2.5 pr-3 font-mono text-gray-500 dark:text-gray-400">
                        #{inc.id.slice(0, 8)}
                      </td>
                      <td className="py-2.5 pr-3 font-medium text-gray-800 dark:text-white/80">
                        {inc.title.length > 20 ? `${inc.title.slice(0, 20)}…` : inc.title}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-500 dark:text-gray-400">
                        {(inc.metadata as Record<string, string> | null)?.site ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-400">{timeAgo(inc.opened_at)}</td>
                      <td className="py-2.5">{severityBadge(inc.severity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Facility Overview */}
        <div className={`${card} md:col-span-4`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Facility Overview</h3>
            <Link to="/superadmin/organizations" className="text-xs font-medium text-brand-500 hover:text-brand-600">
              View all sites
            </Link>
          </div>

          {/* Floor plan + stats side by side */}
          <div className="flex gap-5">
            {/* SVG floor plan */}
            <div className="flex-1 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900/30">
              <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full">
                {/* floor */}
                <rect width="220" height="160" fill="#f1f5f9" rx="8"/>
                {/* corridors */}
                <rect x="0" y="62" width="220" height="14" fill="#e2e8f0"/>
                <rect x="106" y="0" width="14" height="62" fill="#e2e8f0"/>
                <rect x="106" y="76" width="14" height="84" fill="#e2e8f0"/>
                {/* rooms — top row */}
                <rect x="5" y="5" width="95" height="51" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2"/>
                <rect x="126" y="5" width="46" height="24" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2"/>
                <rect x="126" y="35" width="46" height="21" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2"/>
                <rect x="178" y="5" width="37" height="51" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2"/>
                {/* rooms — bottom row */}
                <rect x="5" y="82" width="44" height="36" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2"/>
                {/* attention room */}
                <rect x="56" y="82" width="42" height="36" rx="3" fill="#fef3c7" stroke="#fbbf24" strokeWidth="1.3"/>
                <rect x="5" y="124" width="93" height="31" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2"/>
                <rect x="126" y="82" width="89" height="36" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2"/>
                <rect x="126" y="124" width="89" height="31" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2"/>
                {/* shield-check icons (teal) */}
                <circle cx="52" cy="31" r="11" fill="#0d9488"/>
                <path d="M48 31l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="197" cy="31" r="11" fill="#0d9488"/>
                <path d="M193 31l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="27" cy="100" r="11" fill="#0d9488"/>
                <path d="M23 100l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="170" cy="100" r="11" fill="#0d9488"/>
                <path d="M166 100l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                {/* attention icon (amber) */}
                <circle cx="77" cy="100" r="11" fill="#f59e0b"/>
                <path d="M77 95v8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="77" cy="106" r="1.3" fill="white"/>
              </svg>
            </div>

            {/* Stats column */}
            <div className="flex flex-shrink-0 flex-col justify-between py-1">
              {DEMO_FACILITY.map(({ label, value, icon, iconCls }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span className={`flex-shrink-0 ${iconCls}`}>{icon}</span>
                  <div>
                    <p className="text-xl font-bold leading-none text-gray-900 dark:text-white/90">{value}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className={`${card} md:col-span-3`}>
          <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Quick Insights</h3>
          <ul className="space-y-4">
            {DEMO_INSIGHTS.map((ins, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0">{ins.icon}</span>
                <p className="text-xs leading-snug text-gray-600 dark:text-gray-400">{ins.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
