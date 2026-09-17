'use strict';

// Right-click on a tab -> preselect its container in the popup and open it.
// The actual wipe still requires an explicit confirmation click in the popup;
// this menu item is only a shortcut to get there.
browser.menus.create({
  id: 'clear-container-for-tab',
  title: 'Clear Container for this tab…',
  contexts: ['tab']
});

browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'clear-container-for-tab') return;
  if (!tab.cookieStoreId || tab.cookieStoreId === 'firefox-default') return;

  await browser.storage.local.set({ pendingCookieStoreId: tab.cookieStoreId });
  try {
    await browser.browserAction.openPopup();
  } catch (e) {
    // openPopup() is best-effort; if it fails the user can still open the
    // popup manually and it will pick up the pending selection.
  }
});
