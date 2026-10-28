/**
 * TanStack Query key factory for detection-event queries.
 * cameraSourceId is part of the key so that switching cameras
 * uses separate cache entries and never mixes records.
 */
export const detectionKeys = {
  all: (orgId: string) => ["detections", orgId] as const,
  recent: (orgId: string, limit: number, cameraSourceId: string | null) =>
    ["detections", orgId, "recent", limit, cameraSourceId] as const,
};
