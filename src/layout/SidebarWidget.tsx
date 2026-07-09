import { Link } from "react-router";

export default function SidebarWidget() {
  return (
    <div className="mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]">
      <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">Sentrix Console</h3>
      <p className="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
        Manage your organization, members, and preferences.
      </p>
      <Link
        to="/settings"
        className="flex items-center justify-center rounded-lg bg-brand-500 p-3 text-theme-sm font-medium text-white hover:bg-brand-600"
      >
        Open settings
      </Link>
    </div>
  );
}
