import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";
import type { LeadStage } from "../api/leads.types";

// Shared formatters (re-exported for this feature's components).
export { titleCase, humanize, formatDateTime } from "../../../lib/format";

export const leadStageTone: Record<LeadStage, Tone> = {
  new: "info",
  qualified: "warning",
  quoted: "primary",
  won: "success",
  lost: "error",
};

export const STAGE_OPTIONS: FilterOption[] = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const CLIENT_TYPE_OPTIONS: FilterOption[] = [
  { value: "university", label: "University" },
  { value: "estate", label: "Estate" },
  { value: "company", label: "Company" },
  { value: "other", label: "Other" },
];
