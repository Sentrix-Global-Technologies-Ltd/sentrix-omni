/** True only for an absolute https URL — never redirect to a relative/sandbox path. */
export function isHostedCheckoutUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
