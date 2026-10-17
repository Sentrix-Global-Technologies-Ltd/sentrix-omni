type ProgressBarSize = "sm" | "md" | "lg" | "xl";
type ProgressBarLabel = "none" | "outside" | "inside";

type ProgressBarProps = {
  progress: number;
  size?: ProgressBarSize;
  label?: ProgressBarLabel;
  className?: string;
};

const sizeClasses: Record<ProgressBarSize, string> = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
  xl: "h-5",
};

export default function ProgressBar({
  progress,
  size = "sm",
  label = "none",
  className = "",
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const trackClass = `relative w-full bg-gray-200 rounded-full dark:bg-gray-800 ${sizeClasses[size]} ${className}`;
  const fillClass = `absolute start-0 h-full bg-brand-500 rounded-full ${sizeClasses[size]}`;

  return (
    <div>
      {label === "outside" && (
        <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {clampedProgress}%
        </span>
      )}
      <div className={trackClass}>
        <div
          className={fillClass}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {label === "inside" && (
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
              {clampedProgress}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
