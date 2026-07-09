import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useOrganization } from "../../context/OrganizationContext";

/**
 * Current-organization indicator + switcher (shared shell component).
 *
 * - Single org: renders a static label.
 * - Multiple orgs: a dropdown that switches the active organization via
 *   OrganizationContext (which updates the API org header + re-hydrates identity).
 * Built for multi-organization users from day one even though most users have one.
 */
export default function OrganizationSwitcher() {
  const { current, organizations, activeId, canSwitch, switching, switchOrganization } =
    useOrganization();
  const [isOpen, setIsOpen] = useState(false);

  if (!current && organizations.length === 0) return null;

  const label = current?.name ?? "No organization";

  const trigger = (
    <span className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-white/10 dark:text-white/90">
        {label.charAt(0).toUpperCase()}
      </span>
      <span className="max-w-[140px] truncate text-theme-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
    </span>
  );

  if (!canSwitch) {
    return (
      <div className="hidden items-center rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800 sm:flex">
        {trigger}
      </div>
    );
  }

  return (
    <div className="relative hidden sm:block">
      <button
        onClick={() => setIsOpen((v) => !v)}
        disabled={switching}
        className="dropdown-toggle flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:hover:bg-white/[0.03]"
      >
        {trigger}
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="mt-2 flex w-[240px] flex-col p-2"
      >
        <p className="px-2 pb-2 pt-1 text-theme-xs uppercase tracking-wide text-gray-400">
          Organizations
        </p>
        {organizations.map((org) => (
          <DropdownItem
            key={org.id}
            tag="button"
            onItemClick={() => {
              setIsOpen(false);
              void switchOrganization(org.id);
            }}
            baseClassName="flex w-full items-center justify-between rounded-lg px-3 py-2 text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <span className="truncate">{org.name}</span>
            {org.id === activeId && (
              <span className="text-brand-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </DropdownItem>
        ))}
      </Dropdown>
    </div>
  );
}
