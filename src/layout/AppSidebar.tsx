import { Link, useLocation } from "react-router";
import { HorizontaLDots } from "../icons";
import Logo from "../components/common/Logo";
import { useSidebar } from "../context/SidebarContext";
import { useAuthz } from "../hooks/useAuthz";
import { navigation, type NavGroup } from "../config/navigation";

/**
 * Role-aware application sidebar.
 *
 * Extends the TailAdmin sidebar pattern (collapse / hover-expand / mobile drawer,
 * `menu-item*` design-system classes) but renders from the central `navigation`
 * config filtered by the API identity (useAuthz). Empty groups are hidden, so a
 * user only ever sees the sections they are authorized to access.
 */
const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { isAllowed, isOrgMember } = useAuthz();
  const location = useLocation();

  const expanded = isExpanded || isHovered || isMobileOpen;

  const isActive = (path: string): boolean =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  // Filter items + groups by the current identity's access. requireOrgMembership
  // is checked separately from isAllowed(): isAllowed() always says yes for a
  // SuperAdmin (allow-all, mirroring the backend's Gate::before), but a couple
  // of items (Billing's personal subscription self-service) genuinely have
  // nothing to do with admin authority and shouldn't appear for platform staff
  // who aren't members of any organization, SuperAdmin included.
  const visibleGroups: NavGroup[] = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => isAllowed(item.access) && (!item.requireOrgMembership || isOrgMember),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${expanded ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 flex ${!expanded ? "lg:justify-center" : "justify-start"}`}
      >
        <Link to="/" aria-label="Sentrix home">
          <Logo iconOnly={!expanded} />
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {visibleGroups.map((group) => (
              <div key={group.title}>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !expanded ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {expanded ? group.title : <HorizontaLDots className="size-6" />}
                </h2>

                <ul className="flex flex-col gap-2">
                  {group.items.map((item) => (
                    <li key={item.key}>
                      <Link
                        to={item.path}
                        className={`menu-item group ${
                          isActive(item.path)
                            ? "menu-item-active"
                            : "menu-item-inactive"
                        } ${!expanded ? "lg:justify-center" : "lg:justify-start"}`}
                      >
                        <span
                          className={`menu-item-icon-size ${
                            isActive(item.path)
                              ? "menu-item-icon-active"
                              : "menu-item-icon-inactive"
                          }`}
                        >
                          {item.icon}
                        </span>
                        {expanded && (
                          <span className="menu-item-text">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
