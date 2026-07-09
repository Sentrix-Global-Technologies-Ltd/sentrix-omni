import type { ReactNode } from "react";
import Breadcrumb, { type Crumb } from "./Breadcrumb";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Breadcrumb trail after Home (Home is added automatically). */
  breadcrumbs?: Crumb[];
  /** Right-aligned actions (buttons, filters) for the page. */
  actions?: ReactNode;
}

/**
 * Page header system (shared): consistent title + breadcrumb + actions row for
 * every console page. Feature pages compose this rather than re-implementing
 * headers.
 */
export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
        {actions}
      </div>
    </div>
  );
}
