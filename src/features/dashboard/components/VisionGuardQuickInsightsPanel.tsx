import { CheckCircleIcon, MapPinIcon, GroupIcon, ArrowRightIcon } from '../../../icons';
import type { ReactNode } from 'react';

type InsightRow = { icon: ReactNode; title: string; body: string };

/**
 * VisionGuardQuickInsightsPanel
 * MOCK: All three insight rows are Bolt reference values.
 * No insights API exists — these are retained as-is from the Bolt design.
 */
const INSIGHTS: InsightRow[] = [
  {
    icon: <CheckCircleIcon style={{ width: 16, height: 16 }} />,
    title: 'Perimeter breaches increased',
    body:  '18% in the last 7 days.',
  },
  {
    icon: <MapPinIcon style={{ width: 16, height: 16 }} />,
    title: 'AI detections prevented',
    body:  '24 potential incidents.',
  },
  {
    icon: <GroupIcon style={{ width: 16, height: 16 }} />,
    title: 'All sites are compliant',
    body:  'with security policies.',
  },
];

export default function VisionGuardQuickInsightsPanel() {
  return (
    <section className="panel insights-panel">
      <div className="panel-title">
        {/* MOCK: all insight rows are Bolt reference values */}
        <h2>Quick Insights <span title="Mock data — no insights API" style={{ fontSize: 9, opacity: 0.4 }}>*</span></h2>
        <button className="text-link">View all</button>
      </div>

      {INSIGHTS.map((ins) => (
        <button className="insight-row" key={ins.title}>
          {ins.icon}
          <span>
            <strong>{ins.title}</strong>
            <small>{ins.body}</small>
          </span>
          <ArrowRightIcon style={{ width: 13, height: 13 }} />
        </button>
      ))}
    </section>
  );
}
