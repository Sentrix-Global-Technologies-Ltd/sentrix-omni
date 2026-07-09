export interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

/** Shared underline tab bar (segmented navigation within a console page). */
export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="mb-5 border-b border-gray-200 dark:border-gray-800">
      <nav className="-mb-px flex gap-6">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition ${
                isActive
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
