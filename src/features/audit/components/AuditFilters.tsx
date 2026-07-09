import FilterBar from "../../../components/shared/FilterBar";
import FilterText from "../../../components/shared/FilterText";
import Button from "../../../components/ui/button/Button";
import type { AuditFilters as Filters } from "../api/audit.types";

interface Props {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
}

/** Audit filters — exact action match (e.g. "incident.opened"). */
export default function AuditFilters({ filters, onChange, onClear }: Props) {
  return (
    <FilterBar
      trailing={
        filters.action ? (
          <Button size="sm" variant="outline" onClick={onClear}>
            Clear
          </Button>
        ) : undefined
      }
    >
      <FilterText
        label="Action"
        value={filters.action ?? ""}
        placeholder="e.g. incident.opened"
        onChange={(v) => onChange({ action: v || undefined })}
      />
    </FilterBar>
  );
}
