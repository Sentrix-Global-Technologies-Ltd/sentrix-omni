import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import Button from "../../../components/ui/button/Button";
import { CLIENT_TYPE_OPTIONS, STAGE_OPTIONS } from "./leadTone";
import type { LeadFilters as Filters } from "../api/leads.types";

interface Props {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
}

/** Lead pipeline filters — composes shared FilterBar + FilterSelect. */
export default function LeadFilters({ filters, onChange, onClear }: Props) {
  const hasFilters = Boolean(filters.stage || filters.client_type);

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
        label="Stage"
        value={filters.stage ?? ""}
        options={STAGE_OPTIONS}
        placeholder="All stages"
        onChange={(v) => onChange({ stage: v || undefined })}
      />
      <FilterSelect
        label="Client type"
        value={filters.client_type ?? ""}
        options={CLIENT_TYPE_OPTIONS}
        placeholder="All types"
        onChange={(v) => onChange({ client_type: v || undefined })}
      />
    </FilterBar>
  );
}
