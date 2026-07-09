/**
 * Bearer-token storage for the Sentrix Console.
 *
 * Deliberately uses **sessionStorage**, not localStorage: tokens are scoped to
 * the browser tab and cleared when the tab closes, which narrows the exposure
 * window versus persistent localStorage tokens.
 *
 * Two tokens are held:
 *   - the short-lived **access** token (sent on every request);
 *   - the long-lived **refresh** token (used only to mint a new pair when the
 *     access token expires — see services/api/client silent-refresh).
 *
 * `clear()` removes both, so a logout / 401 tears down the whole session.
 */

const TOKEN_KEY = "sentrix.token";
const REFRESH_KEY = "sentrix.refresh_token";

function read(key: string): string | null {
  try {
    const value = sessionStorage.getItem(key);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode / disabled) — auth simply won't persist
    // across reloads; the in-memory session for this load still works.
  }
}

function remove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const tokenStorage = {
  get: (): string | null => read(TOKEN_KEY),
  set: (token: string): void => write(TOKEN_KEY, token),

  getRefresh: (): string | null => read(REFRESH_KEY),
  setRefresh: (token: string): void => write(REFRESH_KEY, token),

  clear(): void {
    remove(TOKEN_KEY);
    remove(REFRESH_KEY);
  },
};
