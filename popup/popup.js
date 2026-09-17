'use strict';

const loadingEl = document.getElementById('loading');
const emptyEl = document.getElementById('empty');
const pickerEl = document.getElementById('picker');
const selectEl = document.getElementById('container-select');
const tabWarningEl = document.getElementById('tab-warning');
const alsoCacheEl = document.getElementById('also-cache');
const proxyNoteEl = document.getElementById('proxy-note');
const clearBtn = document.getElementById('clear-btn');
const confirmRow = document.getElementById('confirm-row');
const confirmBtn = document.getElementById('confirm-btn');
const cancelBtn = document.getElementById('cancel-btn');
const resultEl = document.getElementById('result');

let identities = [];

async function init() {
  identities = await browser.contextualIdentities.query({});

  if (identities.length === 0) {
    loadingEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    return;
  }

  for (const identity of identities) {
    const opt = document.createElement('option');
    opt.value = identity.cookieStoreId;
    opt.textContent = identity.name;
    selectEl.appendChild(opt);
  }

  const { pendingCookieStoreId } = await browser.storage.local.get('pendingCookieStoreId');
  if (pendingCookieStoreId && identities.some(i => i.cookieStoreId === pendingCookieStoreId)) {
    selectEl.value = pendingCookieStoreId;
    await browser.storage.local.remove('pendingCookieStoreId');
  }

  loadingEl.classList.add('hidden');
  pickerEl.classList.remove('hidden');

  proxyNoteEl.textContent = 'This wipes the container in place, so its cookieStoreId never changes — any per-container proxy assignment (e.g. in firefox-container-proxy) stays intact automatically.';
  proxyNoteEl.classList.remove('hidden');

  await refreshTabWarning();
  selectEl.addEventListener('change', refreshTabWarning);
}

async function refreshTabWarning() {
  const cookieStoreId = selectEl.value;
  const tabs = await browser.tabs.query({ cookieStoreId });
  if (tabs.length > 0) {
    tabWarningEl.textContent = `${tabs.length} open tab${tabs.length === 1 ? '' : 's'} in this container will be closed before wiping.`;
    tabWarningEl.classList.remove('hidden');
  } else {
    tabWarningEl.classList.add('hidden');
  }
}

clearBtn.addEventListener('click', () => {
  clearBtn.classList.add('hidden');
  confirmRow.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  confirmRow.classList.add('hidden');
  clearBtn.classList.remove('hidden');
});

confirmBtn.addEventListener('click', async () => {
  const cookieStoreId = selectEl.value;
  const identity = identities.find(i => i.cookieStoreId === cookieStoreId);
  const alsoCache = alsoCacheEl.checked;

  confirmBtn.disabled = true;
  cancelBtn.disabled = true;
  confirmBtn.textContent = 'Wiping…';

  try {
    const tabs = await browser.tabs.query({ cookieStoreId });
    if (tabs.length > 0) {
      await browser.tabs.remove(tabs.map(t => t.id));
    }

    await browser.browsingData.remove(
      { cookieStoreId, since: 0 },
      { cookies: true, indexedDB: true, localStorage: true }
    );

    if (alsoCache) {
      await browser.browsingData.remove(
        { since: 0 },
        { cache: true, serviceWorkers: true }
      );
    }

    showResult('success', `"${identity.name}" was wiped. Its settings and cookieStoreId are unchanged.`);
  } catch (err) {
    showResult('error', `Failed to clear container: ${err.message}`);
  }
});

function showResult(kind, message) {
  pickerEl.classList.add('hidden');
  resultEl.textContent = message;
  resultEl.classList.remove('hidden');
  resultEl.classList.add(kind);
}

init();
