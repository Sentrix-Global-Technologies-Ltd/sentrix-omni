export const facilityKeys = {
  all: (orgId: string) => ["facility", orgId] as const,
  map: (orgId: string) => ["facility", orgId, "map"] as const,
  cameraSources: (orgId: string) => ["facility", orgId, "camera-sources"] as const,
};
