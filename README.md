# Clear Container

A Firefox extension that wipes a container's stored state without deleting the
container itself.

## How it works

The toolbar popup lists your containers (Firefox contextual identities). Pick
one, confirm, and the extension:

1. Closes any open tabs in that container.
2. Calls `browser.browsingData.remove({ cookieStoreId }, { cookies, indexedDB,
   localStorage })`, which Firefox scopes to that single container's cookie
   store.

The container itself is never deleted or recreated — its name, icon, color,
and `cookieStoreId` are untouched. This was a deliberate choice over
delete-then-recreate:

- **No settings to restore.** Delete+recreate requires reading back the
  container's name/icon/color and reapplying them; wiping in place skips that
  entirely.
- **Proxy-per-container extensions keep working automatically.** Extensions
  like [firefox-container-proxy](https://github.com/bekh6ex/firefox-container-proxy)
  key their proxy assignment by `cookieStoreId`, store it in their own
  `storage.local`, and expose no external API (`onMessageExternal`/`onMessage`)
  or shared storage another extension could hook into. Delete+recreate changes
  the `cookieStoreId`, silently orphaning that mapping with no way to reattach
  it from outside. Wiping in place never changes the id, so there's nothing to
  re-establish.

### Known limitation

`cookieStoreId` scoping in the `browsingData` API only applies to `cookies`,
`indexedDB`, and `localStorage` — not `cache` or `serviceWorkers`. Those two
can't be cleared for a single container in isolation. The popup has an opt-in
checkbox to clear them anyway, clearly labeled that doing so affects **all**
containers, not just the selected one.

## Bonus: right-click shortcut

Right-clicking a tab shows "Clear Container for this tab…", which opens the
popup with that tab's container preselected. You still have to click through
the confirmation — nothing is wiped without an explicit click.

## Installing (temporary, for development/testing)

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click "Load Temporary Add-on…".
3. Select `manifest.json` in this folder.

The add-on is removed when Firefox restarts; reload it from the same page
during development.

## Permissions used

| Permission           | Why |
|-----------------------|-----|
| `contextualIdentities` | List containers in the popup |
| `browsingData`         | Wipe cookies/storage/IndexedDB scoped to a container |
| `cookies`              | Required alongside `contextualIdentities` for cookie-store APIs |
| `tabs`                 | Find and close tabs open in the target container before wiping |
| `storage`              | Pass the preselected container from the tab context menu to the popup |
| `menus`                | The "Clear Container for this tab…" right-click shortcut |
