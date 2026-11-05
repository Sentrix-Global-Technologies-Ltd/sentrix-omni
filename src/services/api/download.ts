/**
 * Authenticated file download.
 *
 * The JSON apiClient unwraps the `{ success, data }` envelope and can't handle
 * binary/CSV bodies, so file exports use this raw-fetch path instead: it attaches
 * the bearer token (+ `X-Organization` when scoped), reads the response as a Blob,
 * and triggers a browser download via a temporary object URL.
 */

import { env } from "../../config/env";
import { errorFromStatus, NetworkError, SAFE_MESSAGES } from "./errors";
import { tokenStorage } from "./tokenStorage";

type QueryValue = string | number | boolean | undefined | null;

interface DownloadOptions {
  query?: Record<string, QueryValue>;
  /** Tenant for the `X-Organization` header (org-scoped exports). */
  organizationId?: string | null;
  /** Override the filename; otherwise taken from Content-Disposition, else a default. */
  filename?: string;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = `${env.apiBaseUrl}/${path.replace(/^\/+/, "")}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function filenameFromDisposition(value: string | null): string | null {
  if (!value) return null;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(value);
  return match ? decodeURIComponent(match[1]) : null;
}

async function fetchBlob(path: string, options: DownloadOptions): Promise<{ blob: Blob; name: string }> {
  const { query, organizationId, filename } = options;

  const headers: Record<string, string> = { Accept: "*/*" };
  const token = tokenStorage.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (organizationId) headers["X-Organization"] = organizationId;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { method: "GET", headers });
  } catch {
    throw new NetworkError(SAFE_MESSAGES.network, 0);
  }

  if (!response.ok) {
    throw errorFromStatus(response.status, "The export failed. Please try again.", {});
  }

  const blob = await response.blob();
  const name = filename ?? filenameFromDisposition(response.headers.get("Content-Disposition")) ?? "download";
  return { blob, name };
}

function saveBlob(blob: Blob, name: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadFile(path: string, options: DownloadOptions = {}): Promise<void> {
  const { blob, name } = await fetchBlob(path, options);
  saveBlob(blob, name);
}

/**
 * Fetch an authenticated file and show it in a NEW browser window/tab (e.g. a
 * PDF in the browser's viewer, which has its own download button). The window
 * is opened synchronously on the click — before the network round-trip — so
 * popup blockers allow it; it is then pointed at the blob once it arrives.
 * If the window was blocked, falls back to a normal download.
 */
export async function openFileInNewWindow(path: string, options: DownloadOptions = {}): Promise<void> {
  const win = window.open("", "_blank");
  try {
    const { blob, name } = await fetchBlob(path, options);
    if (!win) {
      saveBlob(blob, name);
      return;
    }

    // Make sure the browser knows it is a PDF so it uses its viewer.
    const typed =
      !blob.type && /\.pdf$/i.test(name) ? new Blob([blob], { type: "application/pdf" }) : blob;
    const objectUrl = URL.createObjectURL(typed);

    try {
      // Embed the file in the blank window's own document. Pointing a freshly
      // opened window straight at a blob: URL leaves some browsers on a blank
      // page; an embedded frame renders reliably (and the viewer inside still
      // has its own download/print buttons).
      win.document.title = name;
      win.document.body.style.margin = "0";
      win.document.body.style.height = "100vh";
      const frame = win.document.createElement("iframe");
      frame.src = objectUrl;
      frame.title = name;
      frame.style.cssText = "border:0;width:100%;height:100%;";
      win.document.body.appendChild(frame);
    } catch {
      win.location.href = objectUrl;
    }

    // Keep the URL alive long enough for the viewer to load it.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
  } catch (err) {
    win?.close();
    throw err;
  }
}
