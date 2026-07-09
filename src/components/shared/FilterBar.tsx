import type { ReactNode } from "react";

/**
 * Shared filter bar layout: a row of filter controls with an optional trailing
 * slot (e.g. a Clear button). Features place FilterSelects inside it.
 */
export default function FilterBar({
  children,
  trailing,
}: {
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-end gap-3">{children}</div>
      {trailing && <div className="flex items-center gap-2">{trailing}</div>}
    </div>
  );
}
