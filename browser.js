/**
 * Cross-browser API (Chrome, Edge, Opera, Brave, Firefox).
 * Firefox supports the `chrome` namespace; we prefer `browser` when present.
 */
const ext = globalThis.browser ?? globalThis.chrome;

if (typeof globalThis.browser === "undefined" && ext) {
  globalThis.browser = ext;
}
