import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import Button from "../../../components/ui/button/Button";
import { SEVERITY_OPTIONS, STATUS_OPTIONS } from "./emergencyTone";
import type { EmergencyFilters as Filters } from "../api/emergencies.types";

interface Props {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
}

/** Emergency filters — composes shared FilterBar + FilterSelect. */
export default function EmergencyFilters({ filters, onChange, onClear }: Props) {
  const hasFilters = Boolean(filters.status || filters.severity);

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
      <FilterSelect
        label="Severity"
        value={filters.severity ?? ""}
        options={SEVERITY_OPTIONS}
        placeholder="All severities"
        onChange={(v) => onChange({ severity: v || undefined })}
      />
    </FilterBar>
  );
}
