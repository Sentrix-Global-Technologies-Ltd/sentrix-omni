import { useEffect, useState } from "react";

interface FilterTextProps {
  label?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

/**
 * Controlled text filter (shared). Commits on Enter/blur (not every keystroke)
 * so URL-driven filters don't refetch on each character.
 */
export default function FilterText({
  label,
  value,
  placeholder,
  onChange,
}: FilterTextProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);

  const commit = () => {
    if (local !== value) onChange(local);
  };

  return (
    <label className="flex flex-col gap-1">
      {label && (
        <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </span>
      )}
      <input
        type="text"
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
        className="h-11 min-w-[220px] rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
      />
    </label>
  );
}
