import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import AppSidebar from "./AppSidebar";
import type { AccessRule } from "../authz/access";

const authz = vi.hoisted(() => ({
  isAllowed: vi.fn(),
  isOrgMember: true,
  isSuperAdmin: false,
}));
vi.mock("../hooks/useAuthz", () => ({ useAuthz: () => authz }));
vi.mock("../context/SidebarContext", () => ({
  useSidebar: () => ({ isExpanded: true, isMobileOpen: false, isHovered: false, setIsHovered: vi.fn() }),
}));
vi.mock("../components/common/Logo", () => ({ default: () => <span>Logo</span> }));

const renderSidebar = () =>
  render(
    <MemoryRouter>
      <AppSidebar />
    </MemoryRouter>,
  );

describe("<AppSidebar> billing entries", () => {
  beforeEach(() => {
    authz.isOrgMember = true;
    authz.isSuperAdmin = false;
  });

  it("shows the org Billing entry to an organization admin and not the platform one", () => {
    authz.isAllowed.mockImplementation((rule?: AccessRule) =>
      rule?.superAdminOnly ? false : rule?.anyPermission ? rule.anyPermission.includes("billing.view") : true,
    );
    renderSidebar();
    expect(screen.getByRole("link", { name: "Billing" })).toHaveAttribute("href", "/billing");
    expect(screen.queryByRole("link", { name: "Billing & Subscriptions" })).not.toBeInTheDocument();
  });

  it("hides org Billing from a SuperAdmin and shows Billing & Subscriptions instead", () => {
    authz.isSuperAdmin = true;
    authz.isAllowed.mockReturnValue(true); // SuperAdmin is allow-all
    renderSidebar();
    expect(screen.queryByRole("link", { name: "Billing" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Billing & Subscriptions" })).toHaveAttribute(
      "href",
      "/superadmin/subscriptions",
    );
  });
});
