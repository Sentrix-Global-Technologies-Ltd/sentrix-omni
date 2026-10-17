import PageHeader from '../../../components/shared/PageHeader';
import FilterSelect from '../../../components/shared/FilterSelect';
import { useOrganization } from '../../../context/OrganizationContext';
import { useState } from 'react';

const DATE_OPTIONS = [
  { value: 'today',   label: 'Today' },
  { value: '7d',      label: 'Last 7 days' },
  { value: '30d',     label: 'Last 30 days' },
  { value: 'custom',  label: 'May 22, 2024' },
];

/**
 * Vision Guard Dashboard page header.
 * Uses the shared PageHeader with FilterSelects placed in the actions slot
 * (right side of the header row) — no separate FilterBar below, no breadcrumbs.
 */
export default function VisionGuardPageHeader() {
  const { current, organizations } = useOrganization();
  const [dateRange, setDateRange] = useState('custom');
  const [site, setSite]           = useState('');

  const siteOptions = (organizations ?? []).map((o) => ({
    value: o.id ?? o.name,
    label: o.name,
  }));

  return (
    <PageHeader
      title="Dashboard"
      description={`Real-time security overview${current ? ` — ${current.name}` : ''}`}
      actions={
        <div className="flex items-end gap-3">
          <FilterSelect
            label="Date range"
            value={dateRange}
            options={DATE_OPTIONS}
            placeholder="Select range"
            onChange={setDateRange}
          />
          <FilterSelect
            label="Site"
            value={site}
            options={siteOptions}
            placeholder="All Sites"
            onChange={setSite}
          />
        </div>
      }
    />
  );
}
