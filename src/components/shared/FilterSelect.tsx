export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label?: string;
  value: string;
  options: FilterOption[];
  placeholder?: string;
  onChange: (value: string) => void;
}

/**
 * Controlled select for URL-driven filters (shared). Unlike the template's
 * uncontrolled form Select, this is fully controlled so filter state can live in
 * the URL (filter convention).
 */
export default function FilterSelect({
  label,
  value,
  options,
  placeholder = "All",
  onChange,
}: FilterSelectProps) {
  return (
    <label className="flex flex-col gap-1">
      {label && (
        <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 min-w-[160px] appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="dark:bg-gray-900">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
