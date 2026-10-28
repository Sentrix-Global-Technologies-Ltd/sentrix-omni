import type { ReactNode } from "react";
import type { Tone } from "../tone";

export interface TimelineItem {
  id: string;
  time?: string | null;
  title: ReactNode;
  description?: ReactNode;
  tone?: Tone;
}

export interface TimelineProps {
  items: TimelineItem[];
  /** Compact mode: smaller text + tighter spacing for narrow sidebar columns */
  compact?: boolean;
}

const dotTone: Record<Tone, string> = {
  primary: "bg-brand-500",
  success: "bg-success-500",
  error: "bg-error-500",
  warning: "bg-warning-500",
  info: "bg-blue-light-500",
  light: "bg-gray-300 dark:bg-gray-600",
  dark: "bg-gray-700",
};

/** Shared vertical timeline. Generic — features map their entries to items. */
export default function Timeline({ items, compact = false }: TimelineProps) {
  return (
    <ol className={`relative border-l border-gray-200 pl-5 dark:border-gray-800 ${compact ? "space-y-3" : "space-y-6"}`}>
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className={`absolute rounded-full ring-4 ring-white dark:ring-gray-900 ${compact ? "-left-[1.45rem] mt-0.5 h-2.5 w-2.5" : "-left-[1.7rem] mt-1 h-3 w-3"} ${dotTone[item.tone ?? "light"]}`}
          />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-start justify-between gap-2">
              <p className={`font-medium text-gray-800 dark:text-white/90 ${compact ? "text-[11px] leading-snug" : "text-sm"}`}>
                {item.title}
              </p>
              {item.time && (
                <time className={`shrink-0 text-gray-400 ${compact ? "text-[9px] leading-snug pt-0.5" : "text-theme-xs"}`}>
                  {item.time}
                </time>
              )}
            </div>
            {item.description && (
              <div className={`text-gray-500 dark:text-gray-400 ${compact ? "text-[9px] uppercase tracking-wide" : "text-sm"}`}>
                {item.description}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
