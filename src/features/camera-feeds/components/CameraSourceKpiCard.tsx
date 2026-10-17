interface Props {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: "teal" | "green" | "orange" | "gray";
  trend?: string;
  loading?: boolean;
}

export default function CameraSourceKpiCard({
  label,
  value,
  icon,
  tone = "teal",
  trend,
  loading,
}: Props) {
  return (
    <div className="cs-kpi-card">
      <span className={`cs-kpi-icon cs-kpi-icon--${tone}`}>{icon}</span>
      <div className="cs-kpi-body">
        <div className="cs-kpi-value">{loading ? "—" : value}</div>
        <div className="cs-kpi-label">{label}</div>
        {trend && !loading && (
          <div className="cs-kpi-trend cs-kpi-trend--flat">{trend}</div>
        )}
      </div>
    </div>
  );
}
