import FilterBar from "../../../components/shared/FilterBar";
import FilterSelect from "../../../components/shared/FilterSelect";
import FilterText from "../../../components/shared/FilterText";
import Button from "../../../components/ui/button/Button";
import { KIND_OPTIONS, SEVERITY_OPTIONS, STATUS_OPTIONS } from "./evidenceTone";
import type { EvidenceFilters } from "../api/evidence.types";

interface Props {
  filters: EvidenceFilters;
  onChange: (next: Partial<EvidenceFilters>) => void;
  onClear: () => void;
}

/** Evidence search facets — composes shared FilterBar + Select/Text. */
export default function ObservationFilters({ filters, onChange, onClear }: Props) {
  const hasFilters = Boolean(
    filters.kind || filters.severity || filters.status || filters.plate || filters.q,
  );

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
      <FilterText
        label="Search"
        value={filters.q ?? ""}
        placeholder="Label contains…"
        onChange={(v) => onChange({ q: v || undefined })}
      />
      <FilterText
        label="Plate"
        value={filters.plate ?? ""}
        placeholder="e.g. ABC123"
        onChange={(v) => onChange({ plate: v || undefined })}
      />
      <FilterSelect
        label="Kind"
        value={filters.kind ?? ""}
        options={KIND_OPTIONS}
        placeholder="All kinds"
        onChange={(v) => onChange({ kind: v || undefined })}
      />
      <FilterSelect
        label="Severity"
        value={filters.severity ?? ""}
        options={SEVERITY_OPTIONS}
        placeholder="All severities"
        onChange={(v) => onChange({ severity: v || undefined })}
      />
      <FilterSelect
        label="Status"
        value={filters.status ?? ""}
        options={STATUS_OPTIONS}
        placeholder="Any"
        onChange={(v) => onChange({ status: v || undefined })}
      />
    </FilterBar>
  );
}
