import { describe, it, expect } from "vitest";
import { isAllowed } from "./access";
import type { Principal } from "../services/api/types";

function principal(overrides: Partial<Principal> = {}): Principal {
  return {
    id: "u1",
    name: "Test User",
    email: "u@example.com",
    phone: null,
    email_verified: true,
    current_organization_id: "org1",
    current_organization: null,
    organizations: [],
    roles: [],
    permissions: [],
    ...overrides,
  };
}

describe("isAllowed", () => {
  it("denies when there is no principal", () => {
    expect(isAllowed(undefined, null)).toBe(false);
    expect(isAllowed({ superAdminOnly: true }, null)).toBe(false);
  });

  it("allows any authenticated principal when the rule is undefined/empty", () => {
    expect(isAllowed(undefined, principal())).toBe(true);
    expect(isAllowed({}, principal())).toBe(true);
  });

  it("treats SuperAdmin as allow-all (including superAdminOnly + arbitrary perms)", () => {
    const p = principal({ roles: ["SuperAdmin"] });
    expect(isAllowed({ superAdminOnly: true }, p)).toBe(true);
    expect(isAllowed({ anyPermission: ["anything.at.all"] }, p)).toBe(true);
  });

  it("denies superAdminOnly to a non-SuperAdmin", () => {
    expect(isAllowed({ superAdminOnly: true }, principal({ permissions: ["incidents.view"] }))).toBe(false);
  });

  it("matches anyPermission", () => {
    expect(isAllowed({ anyPermission: ["incidents.view"] }, principal({ permissions: ["incidents.view"] }))).toBe(true);
    expect(isAllowed({ anyPermission: ["incidents.view"] }, principal({ permissions: ["other"] }))).toBe(false);
  });

  it("matches anyRole", () => {
    expect(isAllowed({ anyRole: ["Dispatcher"] }, principal({ roles: ["Dispatcher"] }))).toBe(true);
    expect(isAllowed({ anyRole: ["Dispatcher"] }, principal({ roles: ["Responder"] }))).toBe(false);
  });

  it("honors orgMemberFallback", () => {
    expect(isAllowed({ orgMemberFallback: true }, principal({ current_organization_id: "org1" }))).toBe(true);
    expect(
      isAllowed({ orgMemberFallback: true }, principal({ current_organization_id: null, organizations: [] })),
    ).toBe(false);
  });
});
