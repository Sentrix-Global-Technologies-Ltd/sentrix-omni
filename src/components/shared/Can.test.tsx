import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Can from "./Can";
import type { AccessRule } from "../../authz/access";

// Mock the authz hook: allow when the rule grants "ok", deny superAdminOnly,
// allow unconstrained rules — enough to exercise <Can>'s render branching.
vi.mock("../../hooks/useAuthz", () => ({
  useAuthz: () => ({
    isAllowed: (rule: AccessRule) =>
      rule?.superAdminOnly === true ? false : (rule?.anyPermission?.includes("ok") ?? !rule.anyPermission),
  }),
}));

describe("<Can>", () => {
  it("renders children when permitted", () => {
    render(
      <Can permission="ok">
        <span>Visible</span>
      </Can>,
    );
    expect(screen.getByText("Visible")).toBeInTheDocument();
  });

  it("hides children and renders the fallback when not permitted", () => {
    render(
      <Can permission="denied" fallback={<span>Denied</span>}>
        <span>Secret</span>
      </Can>,
    );
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
    expect(screen.getByText("Denied")).toBeInTheDocument();
  });
});
