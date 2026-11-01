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
  CheckCircleIcon,
  GroupIcon,
  VideoIcon,
  AudioIcon,
  CameraIcon,
  FileIcon,
  ArrowRightIcon,
} from "../../../icons";
import { useIncidents } from "../../incidents/hooks/useIncidents";
import { useIncidentsRealtime } from "../../incidents/hooks/useIncidentsRealtime";
import { useCameraSourcesSummary, useCameraFeeds } from "../../camera-feeds/hooks/useCameraFeeds";
import { useIntelReport, useThreatScore } from "../../intel/hooks/useIntel";
import { usePlatformOrganizations } from "../../superadmin/hooks/usePlatformOrganizations";
import { useAuthenticatedImage } from "../../../hooks/useAuthenticatedImage";
import { useAuthz } from "../../../hooks/useAuthz";
import { initials } from "../../../lib/principal";
import type { Incident, IncidentSeverity } from "../../incidents/api/incidents.types";
import "../../incidents/styles/incidents-centre.css";
import DashboardKpiCard from "../components/DashboardKpiCard";
import IncidentAnalyticsChart from "../components/IncidentAnalyticsChart";

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
            fontSize: "40px",
            fontWeight: "700",
            color: "#1D2939",
            offsetY: 10,
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
      <Chart options={options} series={[score]} type="radialBar" height={260} />
      <div className="absolute inset-x-0 bottom-8 flex justify-center">
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


// ─── page ────────────────────────────────────────────────────────────────────

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { principal } = useAuth();
  const { current } = useOrganization();

  const orgName = current?.name ?? "Vision Guard";

  // Real data
  const recentIncidents = useIncidents({ per_page: 5 });
  const cameraSummary = useCameraSourcesSummary();
  const cameraFeeds = useCameraFeeds({});
  const threatScore = useThreatScore();
  const intelReport = useIntelReport("30d");

  // Realtime
  const incidentsRt = useIncidentsRealtime();

  // Derived camera breakdown
  const feeds = useMemo(() => cameraFeeds.data?.data ?? [], [cameraFeeds.data]);

  // Prefer granular counts from feeds list; fall back to summary
  const totalCameras  = cameraSummary.data?.data.total  ?? feeds.length;

  const detectionCount = intelReport.data?.data.detections?.total ?? "—";
  const score         = threatScore.data?.data.score ?? 0;
  const factors       = threatScore.data?.data.factors ?? [];
  const firstCamera   = feeds[0] ?? null;
  const incidents5    = recentIncidents.data?.data ?? [];

  const { isSuperAdmin } = useAuthz();
  const platformOrgs = usePlatformOrganizations({ per_page: 10 }, isSuperAdmin);

  // Authenticated image for the dashboard live-camera panel.
  // useAuthenticatedImage fetches the private frame URL with the Bearer token
  // and returns a blob object URL — the same pattern used by CameraFeedCard.
  const { src: cameraFrameSrc, status: cameraFrameStatus } = useAuthenticatedImage(
    firstCamera?.last_frame_url ?? null,
    firstCamera?.last_frame_at ?? null,
  );

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
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 md:gap-5">
        <DashboardKpiCard label="Total Cameras" tone="light" icon={<VideoIcon className="size-6" />} value={totalCameras} sub="↑ live camera estate" loading={cameraSummary.isLoading} to="/vision-guard/camera-sources" />
        <DashboardKpiCard label="Detections (30D)" tone="error" icon={<AlertHexaIcon className="size-6" />} value={detectionCount} sub="↑ last 30 days" loading={intelReport.isLoading} to="/vision-guard/detections" />
        <DashboardKpiCard label="System Uptime" tone="light" icon={<CheckCircleIcon className="size-6" />} value="—" sub="No uptime data available" />
        <DashboardKpiCard label="Monitored Sites" tone="info" icon={<GroupIcon className="size-6" />} value={current ? 1 : "—"} sub="↑ connected to platform" />
        <DashboardKpiCard label="Incidents (30D)" tone="warning" icon={<FileIcon className="size-6" />} value={intelReport.data?.data.incidents.total ?? "—"} sub="↑ last 30 days" loading={intelReport.isLoading} to="/incidents" />
      </div>

      {/* ── 2. Middle row: threat(30%) | camera(70%) ───────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[3fr_7fr] md:gap-5">

        {/* Live Threat Score */}
        <div className={`${card} flex flex-col`}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Live Threat Score</h3>
            {threatScore.data && (
              <span className="text-xs text-gray-400">
                {threatScore.data.data.open_incidents_count} open incident{threatScore.data.data.open_incidents_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-center">
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
            <p className="mt-3 text-center text-sm text-gray-400">No detection data in last 24h.</p>
          )}
          </div>

          <Link
            to="/vision-guard/ai-analytics"
            className="mt-auto flex items-center gap-1 pt-4 text-xs font-medium text-brand-500 hover:text-brand-600"
          >
            View Threat Intelligence <ArrowRightIcon className="size-3" />
          </Link>
        </div>

        {/* Live Camera — expanded 70% width with overlay controls */}
        <div className={card}>
          {/* Card header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                Live Camera Still
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

          {/* Camera viewport with overlay controls */}
          <div className="relative overflow-hidden rounded-xl">
            {cameraFeeds.isLoading ? (
              <div className="h-[300px] animate-pulse bg-gray-100 dark:bg-white/5" />
            ) : cameraFrameSrc ? (
              <img
                src={cameraFrameSrc}
                alt={firstCamera?.label ?? "Camera feed"}
                className="h-[300px] w-full object-cover"
              />
            ) : firstCamera?.last_frame_url && cameraFrameStatus === "loading" ? (
              <div className="h-[300px] animate-pulse bg-gray-100 dark:bg-white/5" />
            ) : (
              <div className="flex h-[300px] items-center justify-center bg-gray-100 dark:bg-white/5">
                <div className="text-center text-gray-400">
                  <VideoIcon className="mx-auto mb-2 size-10" />
                  <p className="text-sm">
                    {cameraFrameStatus === "error" ? "Frame unavailable" : "No live frame available"}
                  </p>
                </div>
              </div>
            )}

            {/* Bottom-left: camera label */}
            {firstCamera && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${firstCamera.feed_status === "live" ? "bg-success-400" : "bg-gray-400"}`} />
                <span className="text-xs font-medium text-white">
                  {firstCamera.site ? `${firstCamera.site} – ` : ""}{firstCamera.label}
                </span>
              </div>
            )}

            {/* Bottom-right: camera controls */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {/* Mute / audio */}
              <button
                type="button"
                aria-label="Toggle audio"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              >
                <AudioIcon className="size-4" />
              </button>
              {/* Snapshot */}
              <button
                type="button"
                aria-label="Take snapshot"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              >
                <CameraIcon className="size-4" />
              </button>
              {/* Fullscreen */}
              <Link
                to="/vision-guard/live"
                aria-label="Open fullscreen view"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              >
                {/* Expand / fullscreen icon (inline — no dedicated SVG in icon set) */}
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </Link>
            </div>
          </div>

          {/* No-camera add-source nudge */}
          {!firstCamera && !cameraFeeds.isLoading && (
            <div className="mt-2 flex justify-end">
              <Link to="/vision-guard/camera-sources" className="text-xs font-medium text-brand-400 hover:text-brand-300">
                Add source →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Bottom row ────────────────────────────────────────────────── */}
      {/* ── Bottom row: role-gated ─────────────────────────────────────────── */}
      {isSuperAdmin ? (
        /* SuperAdmin — Facility Overview only (full width) */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
        {/* Facility Overview */}
        <div className={`${card} md:col-span-12`}>
          {/* Header */}
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Facility Overview</h3>
            <Link to="/superadmin/organizations" className="text-xs font-medium text-brand-500 hover:text-brand-600">
              View all sites
            </Link>
          </div>
          <p className="mb-5 text-xs text-gray-400 dark:text-gray-500">Number of organisations monitored</p>

          {/* Organisation list */}
          {platformOrgs.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="size-10 flex-shrink-0 animate-pulse rounded-full bg-gray-100 dark:bg-white/5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                    <div className="h-2 w-20 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                  </div>
                  <div className="h-2 w-32 animate-pulse rounded-full bg-gray-100 dark:bg-white/5" />
                  <div className="h-3 w-8 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                </div>
              ))}
            </div>
          ) : (() => {
            const orgs = platformOrgs.data?.data ?? [];
            if (orgs.length === 0) {
              return (
                <p className="py-6 text-center text-sm text-gray-400">No organisations found.</p>
              );
            }
            const maxCameras = Math.max(...orgs.map((o) => o.camera_sources_count ?? 0), 1);
            // Deterministic avatar colours — cycles through 6 brand-safe hues
            const AVATAR_COLORS = [
              { bg: "bg-brand-50 dark:bg-brand-500/15",   text: "text-brand-600 dark:text-brand-400"   },
              { bg: "bg-violet-50 dark:bg-violet-500/15", text: "text-violet-600 dark:text-violet-400" },
              { bg: "bg-teal-50 dark:bg-teal-500/15",     text: "text-teal-600 dark:text-teal-400"     },
              { bg: "bg-orange-50 dark:bg-orange-500/15", text: "text-orange-600 dark:text-orange-400" },
              { bg: "bg-rose-50 dark:bg-rose-500/15",     text: "text-rose-600 dark:text-rose-400"     },
              { bg: "bg-amber-50 dark:bg-amber-500/15",   text: "text-amber-600 dark:text-amber-400"   },
            ];
            return (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {orgs.map((org, idx) => {
                  const cameras = org.camera_sources_count ?? 0;
                  const pct = Math.round((cameras / maxCameras) * 100);
                  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  return (
                    <li key={org.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      {/* Initials avatar */}
                      <span
                        className={`flex size-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${color.bg} ${color.text}`}
                      >
                        {initials(org.name)}
                      </span>

                      {/* Name + count */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{org.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{cameras} Camera{cameras !== 1 ? "s" : ""}</p>
                      </div>

                      {/* Progress bar */}
                      <div className="hidden w-32 sm:block">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-brand-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Percentage */}
                      <span className="w-10 flex-shrink-0 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {pct}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </div>
        </div>
      ) : (
        /* Org members — Recent Incidents + Quick Insights (equal halves) */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
        {/* Recent Incidents */}
        <div className={`${card} md:col-span-6`}>
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
        {/* Incident Analytics Chart */}
        <div className={`${card} md:col-span-6`}>
          <IncidentAnalyticsChart />
        </div>
        </div>
      )}
    </>
  );
}
