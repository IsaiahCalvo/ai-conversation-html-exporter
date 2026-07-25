const $ = (id) => document.getElementById(id);
const status = $('status');
const openBtn = $('open');
const pdfBtn = $('pdf');
let lastHtml = '';
let lastMeta = null;
let cachedPrimary = null;

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function setStatus(text) { status.textContent = text; }
function setBusy(busy) { [openBtn, pdfBtn].forEach(btn => { if (btn) btn.disabled = busy; }); }
function normalizeUrlForMatch(raw) {
  try {
    const u = new URL(raw);
    u.hash = '';
    if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, '');
    return `${u.origin}${u.pathname}${u.search}`;
  } catch (_) {
    return String(raw || '').replace(/#.*$/, '').replace(/\/+$/, '');
  }
}
function sourceKeysFor(res) {
  const keys = [];
  if (res.sourceTabId) keys.push(`source-tab:${res.sourceTabId}`);
  const urlKey = normalizeUrlForMatch(res.sourceUrl || res.url || '');
  if (urlKey) keys.push(`source-url:${urlKey}`);
  return [...new Set(keys)];
}
async function sha256(text) {
  const bytes = new TextEncoder().encode(text || '');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function openExportDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open('ai-conversation-html-exporter', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('exports');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  });
}
async function putExportData(id, data) {
  const db = await openExportDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('exports', 'readwrite');
    tx.objectStore('exports').put(data, id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('IndexedDB write failed')); };
  });
}
async function getExportData(id) {
  const db = await openExportDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('exports', 'readonly');
    const req = tx.objectStore('exports').get(id);
    req.onsuccess = () => resolve(req.result || null);
    tx.oncomplete = () => db.close();
    tx.onerror = () => { db.close(); reject(tx.error || new Error('IndexedDB read failed')); };
  });
}
async function focusTab(tab) {
  if (!tab?.id) return false;
  try {
    const res = await chrome.runtime.sendMessage({ type: 'AI_EXPORT_FOCUS_TAB', tabId: tab.id });
    if (res?.ok) return true;
  } catch (_) {}
  const tabUpdate = chrome.tabs.update(tab.id, { active: true }).catch(() => null);
  const winUpdate = tab.windowId ? chrome.windows.update(tab.windowId, { focused: true }).catch(() => null) : Promise.resolve(null);
  await tabUpdate;
  await winUpdate;
  return true;
}
async function getOpenTab(tabId) {
  if (!tabId) return null;
  try { return await chrome.tabs.get(tabId); }
  catch (_) { return null; }
}

async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'AI_EXPORT_PING' });
  } catch (_) {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  }
}

async function requestExport() {
  const tab = await activeTab();
  if (!tab?.id) throw new Error('No active tab.');
  await ensureContentScript(tab.id);
  const res = await chrome.tabs.sendMessage(tab.id, { type: 'AI_EXPORT_HTML' });
  if (!res?.ok) throw new Error(res?.error || 'Export failed.');
  res.sourceTabId = tab.id;
  res.sourceWindowId = tab.windowId;
  res.sourceUrl = tab.url || res.url;
  res.htmlHash = await sha256(res.fingerprint || res.html || '');
  res.legacyHtmlHash = await sha256(res.legacyFingerprint || res.html || '');
  lastHtml = res.html;
  lastMeta = res;
  return res;
}

async function createViewerTab(res, options = {}) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const key = `export:${id}`;
  const exportData = {
    html: res.html,
    htmlHash: res.htmlHash,
    legacyHtmlHash: res.legacyHtmlHash,
    title: res.title,
    provider: res.provider,
    count: res.count,
    sourceUrl: res.sourceUrl || res.url,
    sourceTabId: res.sourceTabId,
    sourceWindowId: res.sourceWindowId,
    createdAt: Date.now()
  };
  await putExportData(id, exportData);
  const viewerTab = await chrome.tabs.create({
    url: chrome.runtime.getURL(`viewer.html?id=${encodeURIComponent(id)}&hash=${encodeURIComponent(res.htmlHash || '')}&legacyHash=${encodeURIComponent(res.legacyHtmlHash || '')}&sourceTabId=${encodeURIComponent(res.sourceTabId || '')}${options.autoPrint ? '&print=1' : ''}`),
    openerTabId: res.sourceTabId
  });
  const index = {
    htmlHash: res.htmlHash,
    legacyHtmlHash: res.legacyHtmlHash,
    exportId: id,
    viewerTabId: viewerTab.id,
    sourceUrl: res.sourceUrl || res.url,
    sourceTabId: res.sourceTabId,
    sourceWindowId: res.sourceWindowId,
    title: res.title,
    provider: res.provider,
    count: res.count,
    updatedAt: Date.now()
  };
  const indexWrites = {};
  for (const sourceKey of sourceKeysFor(res)) indexWrites[sourceKey] = index;
  if (res.htmlHash) indexWrites[`hash:${res.htmlHash}`] = index;
  if (res.legacyHtmlHash) indexWrites[`hash:${res.legacyHtmlHash}`] = index;
  await chrome.storage.session.set(indexWrites);
  return viewerTab;
}

function viewerMetaFromUrl(raw) {
  try {
    const u = new URL(raw || '');
    const viewerUrl = new URL(chrome.runtime.getURL('viewer.html'));
    if (u.origin !== viewerUrl.origin || u.pathname !== viewerUrl.pathname) return null;
    return {
      exportId: u.searchParams.get('id') || '',
      htmlHash: u.searchParams.get('hash') || '',
      legacyHtmlHash: u.searchParams.get('legacyHash') || ''
    };
  } catch (_) {
    return null;
  }
}
function hashesMatch(index, res) {
  return !!index && (
    index.htmlHash === res.htmlHash ||
    index.htmlHash === res.legacyHtmlHash ||
    index.legacyHtmlHash === res.htmlHash ||
    index.legacyHtmlHash === res.legacyHtmlHash
  );
}
function viewerUrlHashesMatch(meta, res) {
  return !!meta && (
    meta.htmlHash === res.htmlHash ||
    meta.htmlHash === res.legacyHtmlHash ||
    meta.legacyHtmlHash === res.htmlHash ||
    meta.legacyHtmlHash === res.legacyHtmlHash
  );
}
async function findViewerByScanningTabs(res) {
  const allTabs = await chrome.tabs.query({});
  const viewerTabs = allTabs
    .map(tab => ({ tab, meta: viewerMetaFromUrl(tab.url) }))
    .filter(x => x.meta?.exportId);
  for (const { tab, meta } of viewerTabs) {
    if (viewerUrlHashesMatch(meta, res)) return { tab, index: meta, key: `url:${meta.exportId}`, scanned: viewerTabs.length };
    const key = `export:${meta.exportId}`;
    const stored = await chrome.storage.session.get(key);
    const data = stored[key];
    if (hashesMatch(data, res)) return { tab, index: data, key, scanned: viewerTabs.length };
  }
  return { tab: null, scanned: viewerTabs.length };
}
async function findExistingViewerTab(res) {
  const hashKeys = [res.htmlHash, res.legacyHtmlHash].filter(Boolean).map(h => `hash:${h}`);
  const hashStored = await chrome.storage.session.get(hashKeys);
  for (const key of hashKeys) {
    const index = hashStored[key];
    if (!hashesMatch(index, res) || !index.viewerTabId) continue;
    const viewerTab = await getOpenTab(index.viewerTabId);
    if (viewerTab) return { tab: viewerTab, index, key, scanned: 0 };
  }

  const keys = sourceKeysFor(res);
  const stored = await chrome.storage.session.get(keys);
  for (const key of keys) {
    const index = stored[key];
    if (!hashesMatch(index, res) || !index.viewerTabId) continue;
    const viewerTab = await getOpenTab(index.viewerTabId);
    if (viewerTab) return { tab: viewerTab, index, key, scanned: 0 };
  }

  return findViewerByScanningTabs(res);
}

async function maybeFocusExistingViewer(res) {
  const existing = await findExistingViewerTab(res);
  if (!existing?.tab) return false;
  await focusTab(existing.tab);
  setStatus(`No changes. Opened existing HTML tab.\nMessages: ${res.count}${existing.scanned ? `\nScanned HTML tabs: ${existing.scanned}` : ''}`);
  return true;
}

async function doOpenTab() {
  setBusy(true);
  try {
    if (cachedPrimary?.existing?.tab?.id && openBtn.textContent === 'View HTML') {
      const liveViewer = await getOpenTab(cachedPrimary.existing.tab.id);
      if (liveViewer) {
        await focusTab(liveViewer);
        setStatus('Opened existing HTML tab.');
        return;
      }
    }

    setStatus('Checking conversation…');
    const res = await requestExport();
    if (await maybeFocusExistingViewer(res)) return;

    setStatus('Creating HTML tab…');
    await createViewerTab(res);
    setStatus(`Opened new tab: ${res.provider}\nMessages: ${res.count}`);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  } finally {
    setBusy(false);
  }
}

async function doPdf() {
  setBusy(true);
  try {
    setStatus('Creating PDF view…');
    const res = lastMeta || await requestExport();
    await createViewerTab(res, { autoPrint: true });
    setStatus(`Opened print dialog. Choose “Save as PDF”.\nMessages: ${res.count}`);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  } finally {
    setBusy(false);
  }
}

async function refreshPrimaryAction() {
  try {
    openBtn.textContent = 'Create HTML Tab';
    const tab = await activeTab();
    if (tab?.url) $('site').textContent = new URL(tab.url).hostname;
    setStatus('Ready.');
  } catch (_) {
    openBtn.textContent = 'Create HTML Tab';
    setStatus('Ready.');
  }
}

refreshPrimaryAction();
openBtn.addEventListener('click', doOpenTab);
pdfBtn.addEventListener('click', doPdf);
