import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import Button from "../../../components/ui/button/Button";
import { STATUS_OPTIONS } from "./assignmentTone";
import type { AssignmentFilters as Filters } from "../api/assignments.types";

interface Props {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
}

/** Assignment filters — status via shared FilterSelect (incident scope handled in the page). */
export default function AssignmentFilters({ filters, onChange, onClear }: Props) {
  const hasFilters = Boolean(filters.status);

  return (
    <FilterBar
      trailing={
        hasFilters ? (
          <Button size="sm" variant="outline" onClick={onClear}>
            Clear
          </Button>
        ) : undefined
      }
    >
      <FilterSelect
        label="Status"
        value={filters.status ?? ""}
        options={STATUS_OPTIONS}
        placeholder="All statuses"
        onChange={(v) => onChange({ status: v || undefined })}
      />
    </FilterBar>
  );
}
