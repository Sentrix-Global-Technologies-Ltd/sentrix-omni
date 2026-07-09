export const settingsKeys = {
  /** Prefix for invalidating everything under the active org. */
  org: (orgId: string) => ["settings", orgId] as const,
  organization: (orgId: string) => ["settings", orgId, "organization"] as const,
  members: (orgId: string) => ["settings", orgId, "members"] as const,
  invitations: (orgId: string) => ["settings", orgId, "invitations"] as const,
};
