# Clear Container

Firefox WebExtension (Manifest V2) that wipes a container's stored state
in place, without deleting/recreating the container.

## Layout

- `manifest.json` — permissions: `contextualIdentities`, `browsingData`,
  `cookies`, `tabs`, `storage`, `menus`.
- `background.js` — registers the tab context-menu item ("Clear Container
  for this tab…"); stores the chosen `cookieStoreId` in `storage.local` and
  opens the popup. Does not perform the wipe itself.
- `popup/popup.html` / `popup.css` / `popup.js` — all wipe logic lives here:
  lists containers via `contextualIdentities.query`, shows an open-tab count
  warning, requires an explicit confirm click, then closes tabs in that
  container and calls `browsingData.remove`.
- `icons/icon.svg` — single SVG used at all declared sizes.

## Core design decision — read before changing the wipe mechanism

The wipe is `browser.browsingData.remove({ cookieStoreId, since: 0 },
{ cookies: true, indexedDB: true, localStorage: true })`, **not**
`contextualIdentities.remove()` + `create()`.

Why this matters: `cookieStoreId` in `RemovalOptions` only scopes `cookies`,
`indexedDB`, and `localStorage` — it does not scope `cache` or
`serviceWorkers`. Those two can only be cleared globally (all containers at
once). The popup exposes that as an explicit, unchecked-by-default,
clearly-labeled opt-in — never fold cache/serviceWorkers into the default
scoped clear, since it would silently affect other containers.

Wiping in place (rather than delete+recreate) was chosen deliberately:

- It keeps `cookieStoreId` stable, so the container's name/icon/color never
  need to be read back and reapplied.
- Proxy-per-container extensions such as
  [firefox-container-proxy](https://github.com/bekh6ex/firefox-container-proxy)
  key their proxy assignment by `cookieStoreId` in their own private
  `storage.local` and expose **no** external API
  (`onMessageExternal`/`onMessage`) — this was verified by reading its source.
  Delete+recreate would silently orphan that mapping with no way to reattach
  it from another extension. Wiping in place never changes the id, so nothing
  needs re-establishing.

Do not reintroduce delete+recreate to "fully" clear cache/service workers
per-container — that tradeoff (breaking proxy assignments and container
settings for a benefit that mostly doesn't matter, since real
logins/sessions live in cookies/storage/indexedDB) was already considered
and rejected.

## Testing

No automated tests. Load via `about:debugging#/runtime/this-firefox` →
"Load Temporary Add-on…" → select `manifest.json`. Reload from the same page
after edits. `web-ext lint` is not installed in this environment; run it if
available before shipping changes.
