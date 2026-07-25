function byteLength(text) {
  return new TextEncoder().encode(text || '').length;
}

async function focusTabById(tabId) {
  if (!tabId) return { ok: false, error: 'Missing tab id.' };
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.id) return { ok: false, error: 'Tab not found.' };

    // Activate first, then focus the window. This order matters when the request
    // came from a popup/extension page that can unload as soon as window focus changes.
    await chrome.tabs.update(tab.id, { active: true });
    if (tab.windowId) await chrome.windows.update(tab.windowId, { focused: true });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

async function publishHereNow({ html, title }) {
  const portableHtml = String(html || '');
  if (!portableHtml) throw new Error('HTML missing; recreate export.');

  const filename = 'index.html';
  const contentType = 'text/html; charset=utf-8';
  const createRes = await fetch('https://here.now/api/v1/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-HereNow-Client': 'ai-conversation-html-exporter/chrome-extension'
    },
    body: JSON.stringify({
      files: [{ path: filename, size: byteLength(portableHtml), contentType }],
      displayName: title || 'AI Conversation',
      displayDescription: 'AI conversation HTML export. Anonymous here.now links expire in 24 hours.'
    })
  });
  if (!createRes.ok) throw new Error(`here.now create failed: HTTP ${createRes.status}`);

  const created = await createRes.json();
  const upload = created?.upload?.uploads?.find(u => u.path === filename) || created?.upload?.uploads?.[0];
  if (!upload?.url || !created?.upload?.finalizeUrl || !created?.upload?.versionId) {
    throw new Error('here.now response missing upload/finalize fields.');
  }

  const uploadHeaders = {};
  for (const [key, value] of Object.entries(upload.headers || {})) {
    if (value != null) uploadHeaders[key] = value;
  }
  const putRes = await fetch(upload.url, {
    method: upload.method || 'PUT',
    headers: uploadHeaders,
    body: new Blob([portableHtml], { type: contentType })
  });
  if (!putRes.ok) throw new Error(`here.now upload failed: HTTP ${putRes.status}`);

  const finalRes = await fetch(created.upload.finalizeUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ versionId: created.upload.versionId })
  });
  if (!finalRes.ok) throw new Error(`here.now finalize failed: HTTP ${finalRes.status}`);

  const finalData = await finalRes.json().catch(() => ({}));
  return {
    ok: true,
    url: finalData.siteUrl || created.siteUrl || '',
    claimUrl: created.claimUrl || '',
    raw: finalData
  };
}


chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'AI_EXPORT_FOCUS_TAB') {
    focusTabById(msg.tabId).then(sendResponse);
    return true;
  }

  if (msg?.type === 'AI_EXPORT_PUBLISH_HERENOW') {
    publishHereNow(msg)
      .then(sendResponse)
      .catch(err => sendResponse({ ok: false, error: err?.message || String(err) }));
    return true;
  }

  return false;
});
