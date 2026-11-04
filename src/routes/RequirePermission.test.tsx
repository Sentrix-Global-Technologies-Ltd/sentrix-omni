import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import RequirePermission from "./RequirePermission";

const authz = vi.hoisted(() => ({
  isAllowed: vi.fn(),
  isOrgMember: true,
  isSuperAdmin: false,
}));
vi.mock("../hooks/useAuthz", () => ({ useAuthz: () => authz }));
vi.mock("../pages/OtherPage/Forbidden", () => ({ default: () => <p>Forbidden</p> }));

function renderAt(guard: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={["/billing"]}>
      <Routes>
        <Route element={guard}>
          <Route path="/billing" element={<p>Org billing</p>} />
        </Route>
        <Route path="/superadmin/subscriptions" element={<p>Platform billing</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("<RequirePermission>", () => {
  beforeEach(() => {
    authz.isAllowed.mockReturnValue(true);
    authz.isOrgMember = true;
    authz.isSuperAdmin = false;
  });

  it("renders the route when allowed", () => {
    renderAt(<RequirePermission rule={{ anyPermission: ["billing.view"] }} requireOrgMembership />);
    expect(screen.getByText("Org billing")).toBeInTheDocument();
  });

  it("shows Forbidden when the rule is not satisfied", () => {
    authz.isAllowed.mockReturnValue(false);
    renderAt(<RequirePermission rule={{ anyPermission: ["billing.view"] }} />);
    expect(screen.getByText("Forbidden")).toBeInTheDocument();
  });

  it("sends a SuperAdmin to the platform page instead of the org-scoped route", () => {
    authz.isSuperAdmin = true;
    renderAt(
      <RequirePermission
        rule={{ anyPermission: ["billing.view"] }}
        requireOrgMembership
        redirectSuperAdminTo="/superadmin/subscriptions"
      />,
    );
    expect(screen.getByText("Platform billing")).toBeInTheDocument();
    expect(screen.queryByText("Org billing")).not.toBeInTheDocument();
  });

  it("does not redirect a regular org admin even when a redirect is configured", () => {
    renderAt(
      <RequirePermission
        rule={{ anyPermission: ["billing.view"] }}
        requireOrgMembership
        redirectSuperAdminTo="/superadmin/subscriptions"
      />,
    );
    expect(screen.getByText("Org billing")).toBeInTheDocument();
  });
});
