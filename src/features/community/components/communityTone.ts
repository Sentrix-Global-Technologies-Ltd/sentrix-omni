import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";
import type { CommunityAlertStatus } from "../api/community.types";

export { formatDateTime, relativeTime } from "../../../lib/format";

export function communityStatusTone(status: CommunityAlertStatus): Tone {
  switch (status) {
    case "active":
      return "success";
    case "unverified":
      return "warning";
    case "resolved":
      return "light";
    case "expired":
      return "dark";
    default:
      return "light";
  }
}

export const COMMUNITY_STATUS_OPTIONS: FilterOption[] = [
  { value: "unverified", label: "Unverified" },
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "expired", label: "Expired" },
];

export const COMMUNITY_SOURCE_OPTIONS: FilterOption[] = [
  { value: "community", label: "Community" },
  { value: "official", label: "Official" },
  { value: "ai", label: "Sentrix AI" },
];

export const COMMUNITY_ANONYMOUS_OPTIONS: FilterOption[] = [
  { value: "true", label: "Anonymous only" },
  { value: "false", label: "Named only" },
];
