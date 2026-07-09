import { useState } from "react";
import { Link } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useNotifications } from "../../features/notifications/hooks/useNotifications";
import { useUnreadCount } from "../../features/notifications/hooks/useUnreadCount";
import { useNotificationsRealtime } from "../../features/notifications/hooks/useNotificationsRealtime";
import { useNotificationMutations } from "../../features/notifications/hooks/useNotificationMutations";
import { humanize, relativeTime } from "../../lib/format";
import type { AppNotification } from "../../features/notifications/api/notifications.types";

function title(n: AppNotification): string {
  const t = n.payload?.title;
  return typeof t === "string" && t ? t : humanize(n.type);
}

function message(n: AppNotification): string {
  const m = n.payload?.message ?? n.payload?.body;
  return typeof m === "string" ? m : "";
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  // Keep notifications live (subscribes to the personal channel).
  useNotificationsRealtime();
  const listQuery = useNotifications();
  const unreadQuery = useUnreadCount();
  const { markAsRead, markAllAsRead } = useNotificationMutations();

  const unread = unreadQuery.data?.data?.count ?? 0;
  const recent = (listQuery.data?.data ?? []).slice(0, 8);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Notifications"
      >
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notifications</h5>
          {unread > 0 && (
            <button
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="text-theme-sm font-medium text-brand-500 hover:text-brand-600 disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {recent.length === 0 && (
            <li className="px-2 py-8 text-center text-theme-sm text-gray-400">
              {listQuery.isLoading ? "Loading…" : "You're all caught up."}
            </li>
          )}

          {recent.map((n) => (
            <li key={n.id}>
              <DropdownItem
                onItemClick={() => {
                  if (!n.read) markAsRead.mutate(n.id);
                  setIsOpen(false);
                }}
                className="flex gap-3 rounded-lg border-b border-gray-100 p-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    n.read ? "bg-transparent" : "bg-brand-500"
                  }`}
                />
                <span className="block">
                  <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {title(n)}
                  </span>
                  {message(n) && (
                    <span className="mt-0.5 block line-clamp-2 text-theme-xs text-gray-500 dark:text-gray-400">
                      {message(n)}
                    </span>
                  )}
                  <span className="mt-1 block text-theme-xs text-gray-400">
                    {relativeTime(n.created_at)}
                  </span>
                </span>
              </DropdownItem>
            </li>
          ))}
        </ul>

        <Link
          to="/notifications"
          onClick={() => setIsOpen(false)}
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          View all notifications
        </Link>
      </Dropdown>
    </div>
  );
}
