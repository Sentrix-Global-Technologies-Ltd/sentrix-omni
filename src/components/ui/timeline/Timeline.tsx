import type { ReactNode } from "react";
import type { Tone } from "../tone";

export interface TimelineItem {
  id: string;
  time?: string | null;
  title: ReactNode;
  description?: ReactNode;
  tone?: Tone;
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
export default function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-6 border-l border-gray-200 pl-6 dark:border-gray-800">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className={`absolute -left-[1.7rem] mt-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-gray-900 ${dotTone[item.tone ?? "light"]}`}
          />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {item.title}
              </p>
              {item.time && (
                <time className="shrink-0 text-theme-xs text-gray-400">
                  {item.time}
                </time>
              )}
            </div>
            {item.description && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {item.description}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
