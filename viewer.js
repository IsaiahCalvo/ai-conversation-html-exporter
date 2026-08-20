const params = new URLSearchParams(location.search);
const id = params.get('id');
const frame = document.getElementById('frame');
const titleEl = document.getElementById('title');
const statusEl = document.getElementById('status');
const originalBtn = document.getElementById('original');
const downloadBtn = document.getElementById('download');
const pdfBtn = document.getElementById('pdf');
const shareBtn = document.getElementById('share');
const publishBtn = document.getElementById('publish');
const publishMenu = document.getElementById('publishMenu');
const publishMenuToggle = document.getElementById('publishMenuToggle');
const goPublishedBtn = document.getElementById('goPublished');
const consentDialog = document.getElementById('consentDialog');
const consentAccept = document.getElementById('consentAccept');
const consentCancel = document.getElementById('consentCancel');
const PUBLISH_CONSENT_KEY = 'hereNowPublishConsent';
let html = '';
let rawHtml = '';
let title = 'AI Conversation';
let sourceUrl = '';
let sourceTabId = null;
let sourceWindowId = null;
let latestPublishedUrl = '';

function numericParam(name) {
  const value = Number(params.get(name));
  return Number.isFinite(value) && value > 0 ? value : null;
}
function filenameSafe(name, ext = '.html') {
  return (name || 'AI Conversation').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 120) + ext;
}
function setStatus(s) { statusEl.textContent = s; }
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
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function isShareAbort(err) {
  return err?.name === 'AbortError' || /share\s+cancell?ed|abort/i.test(String(err?.message || err || ''));
}
function handleShareError(err) {
  if (isShareAbort(err)) setStatus('Share cancelled.');
  else setStatus(`Share unavailable: ${err?.message || err}. Use Download HTML or PDF.`);
}
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('unhandledrejection', (event) => {
    if (isShareAbort(event.reason)) {
      event.preventDefault();
      handleShareError(event.reason);
    }
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
async function openOriginalConversation() {
  try {
    if (sourceTabId) {
      try {
        const tab = await chrome.tabs.get(sourceTabId);
        if (await focusTab(tab)) {
          setStatus('Switched to original tab.');
          return;
        }
      } catch (_) {}
    }
    if (sourceUrl) {
      const wanted = normalizeUrlForMatch(sourceUrl);
      const allTabs = await chrome.tabs.query({});
      const tab = allTabs.find(t => normalizeUrlForMatch(t.url) === wanted)
        || allTabs.find(t => {
          try {
            const a = new URL(t.url);
            const b = new URL(sourceUrl);
            return a.origin === b.origin && a.pathname.replace(/\/+$/, '') === b.pathname.replace(/\/+$/, '');
          } catch (_) { return false; }
        });
      if (tab && await focusTab(tab)) {
        setStatus('Switched to original tab.');
        return;
      }
      await chrome.tabs.create({ url: sourceUrl });
      setStatus('Opened original conversation.');
      return;
    }
    setStatus('No source URL saved.');
  } catch (err) {
    setStatus(`Error: ${err.message || err}`);
  }
}
function prepareHtmlForViewer(raw) {
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  const existingBase = doc.querySelector('base');
  if (existingBase) existingBase.setAttribute('target', '_blank');
  else {
    const base = doc.createElement('base');
    base.setAttribute('target', '_blank');
    doc.head.prepend(base);
  }
  if (sourceUrl) {
    const bounceUrl = chrome.runtime.getURL(
      `viewer.html?id=${encodeURIComponent(id)}&openOriginal=1&sourceTabId=${encodeURIComponent(sourceTabId || '')}`
    );
    for (const a of doc.querySelectorAll('a')) {
      const text = (a.textContent || '').trim().toLowerCase();
      if (text === 'original conversation' || normalizeUrlForMatch(a.href) === normalizeUrlForMatch(sourceUrl)) {
        a.href = bounceUrl;
        a.target = '_top';
        a.rel = '';
      }
    }
  }
  doc.querySelectorAll('script').forEach(s => s.remove());
  return '<!doctype html>\n' + doc.documentElement.outerHTML;
}
function downloadHtml() {
  if (!html) {
    setStatus('HTML missing; recreate export.');
    return;
  }
  const portableHtml = rawHtml || html;
  const blob = new Blob([portableHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filenameSafe(title, '.html');
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  setStatus('HTML download started.');
}
function printPdf() {
  if (!frame.contentWindow) {
    setStatus('HTML frame not ready yet.');
    return;
  }
  setStatus('Opening print dialog. Choose “Save as PDF”.');
  setTimeout(() => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch (err) {
      setStatus(`PDF error: ${err.message || err}`);
    }
  }, 100);
}
function wireFrameRailControls() {
  try {
    const doc = frame.contentDocument;
    if (!doc) return;
    const layout = doc.querySelector('.layout');
    const btn = doc.querySelector('.rail-toggle');
    if (!layout || !btn || btn.dataset.viewerRailWired === '1') return;
    btn.dataset.viewerRailWired = '1';
    const apply = (collapsed) => {
      layout.classList.toggle('rail-collapsed', collapsed);
      btn.setAttribute('aria-label', collapsed ? 'Expand asset rail' : 'Collapse asset rail');
      btn.setAttribute('title', collapsed ? 'Expand asset rail' : 'Collapse asset rail');
    };
    apply(false);
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      const collapsed = !layout.classList.contains('rail-collapsed');
      apply(collapsed);
    });
  } catch (_) {}
}
function wireFrameSourceDownloadControls() {
  try {
    const doc = frame.contentDocument;
    if (!doc || doc.dataset.viewerSourceOriginalWired === '1') return;
    doc.dataset.viewerSourceOriginalWired = '1';
    doc.addEventListener('click', async (event) => {
      const target = event.target?.closest?.('.asset-source-original');
      if (!target) return;
      event.preventDefault();
      await openOriginalConversation();
    });
  } catch (_) {}
}
function byteLength(text) {
  return new TextEncoder().encode(text || '').length;
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
async function getExportData(id) {
  try {
    const db = await openExportDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('exports', 'readonly');
      const req = tx.objectStore('exports').get(id);
      req.onsuccess = () => resolve(req.result || null);
      tx.oncomplete = () => db.close();
      tx.onerror = () => { db.close(); reject(tx.error || new Error('IndexedDB read failed')); };
    });
  } catch (_) {
    const key = `export:${id}`;
    const stored = await chrome.storage.session.get(key);
    return stored[key] || null;
  }
}
async function removeExportData(id) {
  try {
    const db = await openExportDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('exports', 'readwrite');
      tx.objectStore('exports').delete(id);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error || new Error('IndexedDB delete failed')); };
    });
  } catch (_) {}
  try { await chrome.storage.session.remove(`export:${id}`); } catch (_) {}
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    return false;
  }
}
function setPublishMenuOpen(open) {
  publishMenu.classList.toggle('open', open);
  publishMenuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function rememberPublishedUrl(url) {
  latestPublishedUrl = url || '';
  publishMenu.classList.toggle('has-link', Boolean(latestPublishedUrl));
  publishMenuToggle.title = latestPublishedUrl ? `Latest 24h link: ${latestPublishedUrl}` : 'Open latest 24h link options';
}
async function copyPublishedUrl() {
  if (!latestPublishedUrl) {
    setStatus('No 24h link generated yet.');
    return;
  }
  setPublishMenuOpen(false);
  const copied = await copyText(latestPublishedUrl);
  setStatus(copied ? '' : 'Copy failed.');
}
function setConsentDialogOpen(open) {
  consentDialog.classList.toggle('open', open);
  consentDialog.setAttribute('aria-hidden', open ? 'false' : 'true');
}
function showPublishConsentDialog() {
  return new Promise((resolve) => {
    const finish = (ok) => {
      setConsentDialogOpen(false);
      consentAccept.removeEventListener('click', onAccept);
      consentCancel.removeEventListener('click', onCancel);
      document.removeEventListener('keydown', onKey);
      resolve(ok);
    };
    const onAccept = () => finish(true);
    const onCancel = () => finish(false);
    const onKey = (event) => { if (event.key === 'Escape') finish(false); };
    consentAccept.addEventListener('click', onAccept);
    consentCancel.addEventListener('click', onCancel);
    document.addEventListener('keydown', onKey);
    setConsentDialogOpen(true);
    try { consentAccept.focus(); } catch (_) {}
  });
}
async function ensurePublishConsent() {
  try {
    const stored = await chrome.storage.local.get(PUBLISH_CONSENT_KEY);
    if (stored?.[PUBLISH_CONSENT_KEY]) return true;
  } catch (_) {}
  const ok = await showPublishConsentDialog();
  if (!ok) return false;
  try { await chrome.storage.local.set({ [PUBLISH_CONSENT_KEY]: true }); } catch (_) {}
  return true;
}
async function publishHereNow() {
  try {
    const portableHtml = rawHtml || html;
    if (!portableHtml) {
      setStatus('HTML missing; recreate export.');
      return;
    }
    if (!(await ensurePublishConsent())) {
      setStatus('Publish cancelled.');
      return;
    }
    publishBtn.disabled = true;
    const published = await chrome.runtime.sendMessage({
      type: 'AI_EXPORT_PUBLISH_HERENOW',
      html: portableHtml,
      title
    });
    if (!published?.ok) throw new Error(published?.error || 'here.now publish failed.');
    const url = published.url;
    rememberPublishedUrl(url);
    if (url) {
      await copyText(url);
      setStatus('');
    } else setStatus('Published, but no site URL returned.');
  } catch (err) {
    setStatus(`Publish failed: ${err.message || err}`);
  } finally {
    publishBtn.disabled = false;
  }
}

async function shareHtml() {
  try {
    if (!html) {
      setStatus('HTML missing; recreate export.');
      return;
    }
    const portableHtml = rawHtml || html;
    const file = new File([portableHtml], filenameSafe(title, '.html'), { type: 'text/html' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title, text: 'AI conversation HTML export', files: [file] });
      setStatus('Share sheet opened with HTML file. No upload or public link created.');
    } else {
      setStatus('This preview URL is local to this Chrome extension. Native file share is unavailable here, so use Download HTML or PDF.');
    }
  } catch (err) {
    handleShareError(err);
  }
}

(async () => {
  try {
    if (!id) throw new Error('Missing export id.');
    const data = await getExportData(id);
    if (!data?.html) throw new Error('Export expired or missing. Recreate from the conversation tab.');
    sourceUrl = data.sourceUrl || '';
    sourceTabId = data.sourceTabId || numericParam('sourceTabId');
    sourceWindowId = data.sourceWindowId || null;
    title = data.title || 'AI Conversation';
    rawHtml = data.html;
    html = prepareHtmlForViewer(rawHtml);
    document.title = `${title} - HTML Preview`;
    titleEl.textContent = title;
    frame.addEventListener('load', () => { wireFrameRailControls(); wireFrameSourceDownloadControls(); });
    frame.srcdoc = html;
    setStatus('');
    setTimeout(() => removeExportData(id), 10 * 60 * 1000);
    if (params.get('openOriginal') === '1') setTimeout(openOriginalConversation, 0);
    if (params.get('print') === '1') frame.addEventListener('load', () => setTimeout(printPdf, 250), { once: true });
  } catch (err) {
    frame.srcdoc = `<pre style="font:16px/1.5 system-ui;padding:24px;color:#111">${escapeHtml(String(err.message || err))}</pre>`;
    setStatus('Error');
  }
})();

originalBtn.addEventListener('click', openOriginalConversation);
downloadBtn.addEventListener('click', downloadHtml);
pdfBtn.addEventListener('click', printPdf);
shareBtn.addEventListener('click', () => { void shareHtml().catch(handleShareError); });
publishBtn.addEventListener('click', () => { void publishHereNow(); });
publishMenuToggle.addEventListener('click', (event) => {
  event.stopPropagation();
  if (!latestPublishedUrl) return;
  setPublishMenuOpen(!publishMenu.classList.contains('open'));
});
goPublishedBtn.addEventListener('click', () => { void copyPublishedUrl(); });
document.addEventListener('click', (event) => {
  if (!publishMenu.contains(event.target)) setPublishMenuOpen(false);
});
