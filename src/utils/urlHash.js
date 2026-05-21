/**
 * urlHash.js
 * ----------
 * Encode/decode the full app state into a URL hash so charts can be shared.
 *
 * Format: #data=<base64url(JSON)>
 *
 * The encoded object contains:
 *   { csvString: string, chartIdx: number, customization: object }
 *
 * Only encodes datasets ≤ MAX_BYTES to keep URLs reasonable.
 */

const MAX_BYTES = 80_000; // ~80 kB of raw CSV

/**
 * Encode state into the URL hash.
 * @param {{ csvString: string, chartIdx: number, customization: object, fileName: string }} state
 * @returns {boolean} true if encoded, false if data was too large
 */
export function encodeStateToHash(state) {
  try {
    const json = JSON.stringify(state);
    if (json.length > MAX_BYTES) return false;
    const b64 = btoa(unescape(encodeURIComponent(json)));
    window.location.hash = 'data=' + b64;
    return true;
  } catch {
    return false;
  }
}

/**
 * Decode state from the current URL hash.
 * @returns {{ csvString: string, chartIdx: number, customization: object, fileName: string } | null}
 */
export function decodeStateFromHash() {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#data=')) return null;
    const b64 = hash.slice(6);
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Clear the URL hash without adding a history entry.
 */
export function clearHash() {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

/**
 * Build a full shareable URL string for the current state.
 */
export function buildShareUrl(state) {
  try {
    const json = JSON.stringify(state);
    if (json.length > MAX_BYTES) return null;
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const url = new URL(window.location.href);
    url.hash = 'data=' + b64;
    return url.toString();
  } catch {
    return null;
  }
}
