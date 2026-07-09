import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import Button from "../../../components/ui/button/Button";
import { ASSIGNABLE_OPTIONS, STATUS_OPTIONS } from "./responderTone";
import type { ResponderFilters as Filters } from "../api/responders.types";

interface Props {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
}

/** Responder roster filters — composes shared FilterBar + FilterSelect. */
export default function ResponderFilters({ filters, onChange, onClear }: Props) {
  const hasFilters = Boolean(filters.status || filters.assignable);

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
        label="Availability"
        value={filters.assignable ?? ""}
        options={ASSIGNABLE_OPTIONS}
        placeholder="Everyone"
        onChange={(v) => onChange({ assignable: v || undefined })}
      />
    </FilterBar>
  );
}
