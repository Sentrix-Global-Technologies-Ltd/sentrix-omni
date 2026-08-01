import { humanize } from "../../../lib/format";

/** ID document types that are acronyms — rendered upper-case, not title-cased
 *  (humanize("nin") would otherwise read "Nin" instead of "NIN"). */
const ACRONYMS = new Set(["nin"]);

/** Mirrors the backend's identity_verifications.id_type values (see
 *  SubmitIdentityVerificationRequest / mobile's verification/index.tsx
 *  ID_TYPES) — "nin" | "passport" | "drivers_license" | "voters_card". */
export function formatIdType(idType: string): string {
  const lower = idType.toLowerCase();
  return ACRONYMS.has(lower) ? lower.toUpperCase() : humanize(lower);
}
