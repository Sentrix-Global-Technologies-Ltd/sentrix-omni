/** Shared formatting helpers used across feature consoles (DRY). */

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** "status_changed" / "incident.opened" → "Status Changed" / "Incident Opened". */
export function humanize(value: string): string {
  return value.split(/[._]/).map(titleCase).join(" ");
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

/** Naira amount from an integer minor-unit (kobo) value. */
export function formatNaira(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Money from an integer minor-unit value in any ISO currency (never summed across currencies). */
export function formatMoney(cents: number | null | undefined, currency: string): string {
  if (cents == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    // Unknown currency code: show the plain number with the code rather than crash.
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

/** Compact "time ago" for things like a responder's last-seen timestamp. */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
