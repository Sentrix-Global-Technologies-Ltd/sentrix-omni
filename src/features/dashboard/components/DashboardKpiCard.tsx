import type { ReactNode } from "react";
import { Link } from "react-router";
import type { Tone } from "../../../components/ui/tone";
import "../../incidents/styles/incidents-centre.css";

type Accent = "critical" | "warning" | "info" | "success" | "neutral";

const toneAccent: Record<Tone, Accent> = {
  error:   "critical",
  warning: "warning",
  info:    "info",
  success: "success",
  primary: "neutral",
  light:   "neutral",
  dark:    "neutral",
};

const iconBg: Record<Tone, string> = {
  primary: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
  success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  error:   "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
  info:    "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
  light:   "bg-gray-100 text-gray-600 dark:bg-white/[0.05] dark:text-gray-300",
  dark:    "bg-gray-800 text-white",
};

interface Props {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  sub?: string;
  loading?: boolean;
  to?: string;
}

function CardBody({ label, value, icon, tone = "light", sub, loading }: Props) {
  const accent = toneAccent[tone];
  return (
    <div className="ic-stat-card transition hover:shadow-theme-sm">
      {icon && (
        <span
          className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg[tone]}`}
        >
          {icon}
        </span>
      )}
      <p className="ic-stat-label">{label}</p>
      {loading ? (
        <div className="ic-stat-skeleton mt-1" />
      ) : (
        <p className="ic-stat-value">{value}</p>
      )}
      {sub && <p className="ic-stat-sub">{sub}</p>}
      <div className={`ic-stat-accent ic-stat-accent--${accent}`} />
    </div>
  );
}

export default function DashboardKpiCard(props: Props) {
  return props.to ? (
    <Link to={props.to} className="block">
      <CardBody {...props} />
    </Link>
  ) : (
    <CardBody {...props} />
  );
}
