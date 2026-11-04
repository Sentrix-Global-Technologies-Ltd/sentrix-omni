/**
 * Class names that scale a stat/amount value down by its rendered length, so a
 * long figure (e.g. "NGN 5,375,000.00" or several currencies joined) shrinks
 * to fit its card instead of overflowing. Pairs with the `.ic-stat-value--*`
 * rules in incidents-centre.css (which also wrap as a last resort).
 */
export function valueSizeClass(text: string): string {
  const n = text.length;
  const size = n <= 8 ? "" : n <= 12 ? "ic-stat-value--md" : n <= 16 ? "ic-stat-value--sm" : "ic-stat-value--xs";
  return `ic-stat-value ic-stat-value--fit ${size}`.trim();
}
