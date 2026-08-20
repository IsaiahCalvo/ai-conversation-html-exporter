(() => {
  if (window.__AI_CONVERSATION_HTML_EXPORTER_INSTALLED__) return;
  window.__AI_CONVERSATION_HTML_EXPORTER_INSTALLED__ = true;
  const EXPORTER_VERSION = '0.4.22';
  const MAX_INLINE_ASSET_BYTES = 25 * 1024 * 1024;
  window.__AI_EXPORTER_CAPTURED_FILE_URLS__ = window.__AI_EXPORTER_CAPTURED_FILE_URLS__ || {};

  function cleanText(s) {
    return (s || '').replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function attr(s) { return escapeHtml(s).replace(/`/g, '&#96;'); }
  function absoluteUrl(raw) {
    if (!raw) return '';
    try { return new URL(raw, location.href).href; } catch (_) { return raw; }
  }
  function providerFromHost(host = location.hostname) {
    if (host.includes('chatgpt.com')) return { id: 'chatgpt', label: 'ChatGPT', assistant: 'ChatGPT' };
    if (host.includes('claude.ai')) return { id: 'claude', label: 'Claude', assistant: 'Claude' };
    if (host.includes('gemini.google.com')) return { id: 'gemini', label: 'Gemini', assistant: 'Gemini' };
    return { id: 'unknown', label: 'AI', assistant: 'Assistant' };
  }
  function titleFromPage(provider) {
    const candidates = [
      document.querySelector('h1')?.innerText,
      document.querySelector('[data-testid="conversation-title"]')?.innerText,
      document.title
    ].map(cleanText).filter(Boolean);
    let title = candidates.find(t => !/^(ChatGPT|Claude|Gemini|New chat|Shared by)/i.test(t)) || candidates[0] || `${provider.label} Conversation`;
    title = title.replace(/^🟢\s*/, '').replace(/\s*[|-]\s*(ChatGPT|Claude|Gemini|Google Gemini)\s*$/i, '').trim();
    if (!title || /^(chatgpt|claude|gemini)$/i.test(title)) title = `${provider.label} Conversation`;
    return title;
  }
  function slugify(s) {
    return cleanText(s || 'asset').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'asset';
  }
  function firstLine(text, max = 96) {
    const line = cleanText(text || '').split('\n').find(Boolean) || '';
    return line.length > max ? `${line.slice(0, max - 1)}…` : line;
  }
  function stableHash(s) {
    let h = 0x811c9dc5;
    for (const ch of String(s || '')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(36);
  }
  function assetIdentity(item = {}) {
    const title = slugify(item.title || item.name || '');
    const url = String(item.url || '').replace(/[?#].*$/, '');
    const fileId = String(item.url || '').match(/(?:id=|file[_-])([a-z0-9_\-]+)/i)?.[1] || '';
    return fileId || url || title || String(item.content || item.kind || '');
  }
  function uniquePush(arr, item) {
    const key = `${assetCategory(item.kind)}|${assetIdentity(item)}`;
    if (arr.some(x => `${assetCategory(x.kind)}|${assetIdentity(x)}` === key)) return;
    arr.push(item);
  }
  function dedupeAssets(assets = []) {
    const out = [];
    for (const item of assets) {
      const ident = assetIdentity(item);
      const category = assetCategory(item.kind);
      const existingIndex = out.findIndex(x => assetIdentity(x) === ident && assetCategory(x.kind) === category);
      if (existingIndex >= 0) continue;
      // ChatGPT PDF/file attachment tiles can surface as both a protected file button and
      // a decorative/thumbnail asset with the same title. Prefer the actionable file row.
      const crossIndex = out.findIndex(x => ident && assetIdentity(x) === ident && (/file/i.test(x.kind || '') || /file/i.test(item.kind || '')));
      if (crossIndex >= 0) {
        if (/file\/button/i.test(item.kind || '') || (!out[crossIndex].url && item.url)) out[crossIndex] = item;
        continue;
      }
      out.push(item);
    }
    return out;
  }
  function looksLikeDownloadButton(el) {
    const text = cleanText(el?.innerText || el?.textContent || el?.getAttribute?.('aria-label') || '');
    if (!text) return false;
    if (/^(copy|good|bad|share|edit|more|switch|sources|pro feedback|like|dislike)\b/i.test(text)) return false;
    return /\bdownload\b|\.(pdf|docx?|xlsx?|pptx?|csv|txt|zip|json|png|jpe?g|gif|webp|mp4|mov|mp3|wav)\b/i.test(text);
  }
  function fileButtonKey(title, messageIndex) { return `${messageIndex + 1}:${slugify(title)}`; }
  function isInsideDownloadButton(node) {
    return !!node?.closest?.('button,[role="button"]') && looksLikeDownloadButton(node.closest('button,[role="button"]'));
  }
  function rememberedFileUrl(title, key) {
    const store = window.__AI_EXPORTER_CAPTURED_FILE_URLS__ || {};
    return store[key] || store[cleanText(title)] || '';
  }
  function rememberFileUrl(title, key, url) {
    if (!url) return false;
    window.__AI_EXPORTER_CAPTURED_FILE_URLS__ = window.__AI_EXPORTER_CAPTURED_FILE_URLS__ || {};
    if (key) window.__AI_EXPORTER_CAPTURED_FILE_URLS__[key] = url;
    if (title) window.__AI_EXPORTER_CAPTURED_FILE_URLS__[cleanText(title)] = url;
    return true;
  }
  function listInteractiveFileButtonTargets() {
    const buttons = [...document.querySelectorAll('button,[role="button"]')].filter(looksLikeDownloadButton);
    const turnRoots = [...document.querySelectorAll('section[data-testid^="conversation-turn"], [data-turn][data-turn-id-container]')];
    return buttons.map((button, index) => {
      const title = cleanText(button.innerText || button.textContent || button.getAttribute('aria-label') || '');
      const root = button.closest('section[data-testid^="conversation-turn"], [data-turn][data-turn-id-container]');
      if (!root) return null;
      const messageIndex = Math.max(0, turnRoots.indexOf(root));
      const rect = button.getBoundingClientRect();
      return {
        title,
        key: fileButtonKey(title, messageIndex),
        messageIndex: messageIndex + 1,
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        alreadyCaptured: !!rememberedFileUrl(title, fileButtonKey(title, messageIndex))
      };
    }).filter(t => t && t.title && t.width > 0 && t.height > 0 && /^(download\b|.*\.(pdf|docx?|xlsx?|pptx?|csv|txt|zip|json|png|jpe?g|gif|webp|mp4|mov|mp3|wav)\b)/i.test(t.title));
  }
  function clickInteractiveFileButton(title, key) {
    const wanted = cleanText(title);
    const wantedKey = cleanText(key);
    if (!wanted && !wantedKey) return { ok: false, error: 'Missing file title.' };
    const buttons = [...document.querySelectorAll('button,[role="button"]')].filter(looksLikeDownloadButton);
    const turnRoots = [...document.querySelectorAll('section[data-testid^="conversation-turn"], [data-turn][data-turn-id-container], [data-message-author-role]')];
    const withKeys = buttons.map((button, index) => {
      const text = cleanText(button.innerText || button.textContent || button.getAttribute('aria-label') || '');
      const root = button.closest('section[data-testid^="conversation-turn"], [data-turn][data-turn-id-container], [data-message-author-role]');
      const messageIndex = root ? Math.max(0, turnRoots.indexOf(root)) : index;
      return { button, index, text, key: fileButtonKey(text, messageIndex) };
    });
    const hit = withKeys.find(x => wantedKey && x.key === wantedKey)
      || withKeys.find(x => wanted && x.text === wanted)
      || withKeys.find(x => wanted && x.text.includes(wanted))
      || withKeys.find(x => wanted && wanted.includes(x.text));
    if (!hit?.button) return { ok: false, error: `File button not found: ${wanted || wantedKey}` };
    hit.button.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      hit.button.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }
    return { ok: true, matched: hit.text };
  }
  async function convertInteractiveFileButtons(clone, sourceEl, assets, messageIndex) {
    const sourceButtons = [...sourceEl.querySelectorAll('button,[role="button"]')].filter(looksLikeDownloadButton);
    if (!sourceButtons.length) return;
    const cloneButtons = [...clone.querySelectorAll('button,[role="button"]')].filter(looksLikeDownloadButton);
    for (let i = 0; i < sourceButtons.length; i++) {
      const src = sourceButtons[i];
      const dst = cloneButtons[i];
      const title = cleanText(src.innerText || src.textContent || src.getAttribute('aria-label') || `File in message ${messageIndex + 1}`);
      // Deliberately do not click/download/open ChatGPT interactive file buttons.
      // Some ChatGPT download URLs only materialize from React click handlers; triggering them
      // causes visible browser side effects. Safer export behavior: preserve the file label
      // in the HTML + asset rail, and only link static URLs already present in DOM elsewhere.
      const key = fileButtonKey(title, messageIndex);
      const capturedUrl = rememberedFileUrl(title, key);
      let capturedDataUrl = capturedUrl ? await fetchAsDataUrl(capturedUrl) : '';
      const capturedMime = (capturedDataUrl.match(/^data:([^;]+)/) || [])[1] || '';
      uniquePush(assets, {
        kind: capturedUrl ? 'file/link' : 'file/button',
        title,
        url: capturedDataUrl || capturedUrl || '',
        sourceUrl: capturedUrl || '',
        embedded: !!capturedDataUrl,
        mime: capturedMime,
        messageIndex: messageIndex + 1,
        downloadTitle: title,
        downloadKey: key
      });
      if (!dst) continue;
      const replacement = document.createElement('span');
      replacement.textContent = title;
      replacement.setAttribute('data-ai-export-captured', 'interactive-download-label');
      const wrapper = dst.closest?.('[aria-label]');
      if (wrapper && cleanText(wrapper.getAttribute('aria-label')) === title && wrapper !== clone) wrapper.replaceWith(replacement);
      else dst.replaceWith(replacement);
    }
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });
  }
  async function fetchAsDataUrl(url) {
    if (!url || /^data:/i.test(url)) return url || '';
    if (!/^https?:|^blob:/i.test(url)) return '';
    try {
      const res = await fetch(url, { credentials: 'include', cache: 'force-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (blob.size > MAX_INLINE_ASSET_BYTES) throw new Error(`asset too large: ${blob.size}`);
      return await blobToDataUrl(blob);
    } catch (_) { return ''; }
  }
  function canvasToDataUrl(img) {
    try {
      if (!img?.naturalWidth || !img?.naturalHeight) return '';
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (_) { return ''; }
  }

  const DROP_SELECTOR = [
    'script','style','noscript','svg symbol','button','textarea','input','select','nav','aside','form',
    '[contenteditable="true"]','[aria-hidden="true"]','.sr-only','.visually-hidden','.cdk-visually-hidden',
    '[data-testid*="copy"]','[data-testid*="feedback"]','[data-testid*="share"]','[data-testid*="toolbar"]',
    '[data-testid*="action"]','[data-find-omitted]','model-thinking','sources-carousel-inline','source-inline-chip'
  ].join(',');
  const ALLOWED_TAGS = new Set('P BR DIV SPAN STRONG B EM I U S UL OL LI PRE CODE BLOCKQUOTE TABLE THEAD TBODY TFOOT TR TH TD H1 H2 H3 H4 H5 H6 A HR IMG PICTURE SOURCE FIGURE FIGCAPTION VIDEO AUDIO DETAILS SUMMARY KBD SAMP MARK SUP SUB DEL INS TIME MATH'.split(' '));
  const KEEP_ATTRS = new Set('href src srcset alt title aria-label download target rel controls poster width height colspan rowspan datetime type'.split(' '));

  async function prepareMedia(clone, sourceEl, assets, messageIndex) {
    const sourceNodes = [...sourceEl.querySelectorAll('img, video, audio, source, a, canvas')].filter(n => !isInsideDownloadButton(n));
    const cloneNodes = [...clone.querySelectorAll('img, video, audio, source, a, canvas')].filter(n => !n.hasAttribute('data-ai-export-captured'));
    for (let i = 0; i < cloneNodes.length; i++) {
      const node = cloneNodes[i];
      const srcNode = sourceNodes[i];
      if (!srcNode) continue;
      const tag = node.tagName;
      if (tag === 'IMG') {
        const originalUrl = absoluteUrl(srcNode.currentSrc || srcNode.src || srcNode.getAttribute('src') || srcNode.getAttribute('data-src') || '');
        let dataUrl = await fetchAsDataUrl(originalUrl);
        if (!dataUrl) dataUrl = canvasToDataUrl(srcNode);
        if (dataUrl) node.setAttribute('src', dataUrl);
        else if (originalUrl) node.setAttribute('src', originalUrl);
        node.removeAttribute('srcset');
        const alt = srcNode.getAttribute('alt') || srcNode.getAttribute('aria-label') || srcNode.title || `Image in message ${messageIndex + 1}`;
        node.setAttribute('alt', alt);
        if (originalUrl) node.setAttribute('data-original-src', originalUrl);
        uniquePush(assets, { kind: 'image', title: alt, url: originalUrl, embedded: !!dataUrl, mime: (dataUrl.match(/^data:([^;]+)/)||[])[1] || '', messageIndex: messageIndex + 1 });
      } else if (tag === 'VIDEO' || tag === 'AUDIO' || tag === 'SOURCE') {
        const originalUrl = absoluteUrl(srcNode.currentSrc || srcNode.src || srcNode.href || srcNode.getAttribute('src') || '');
        let dataUrl = await fetchAsDataUrl(originalUrl);
        if (dataUrl) node.setAttribute('src', dataUrl);
        else if (originalUrl) node.setAttribute('src', originalUrl);
        if (tag === 'VIDEO' || tag === 'AUDIO') node.setAttribute('controls', 'controls');
        const poster = tag === 'VIDEO' ? absoluteUrl(srcNode.getAttribute('poster') || '') : '';
        if (poster) {
          const posterData = await fetchAsDataUrl(poster);
          node.setAttribute('poster', posterData || poster);
        }
        if (originalUrl) uniquePush(assets, { kind: tag.toLowerCase(), title: `${tag.toLowerCase()} in message ${messageIndex + 1}`, url: originalUrl, embedded: !!dataUrl, messageIndex: messageIndex + 1 });
      } else if (tag === 'A') {
        const href = absoluteUrl(srcNode.getAttribute('href') || '');
        if (href) node.setAttribute('href', href);
        node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer');
        const text = cleanText(srcNode.innerText || srcNode.textContent || srcNode.getAttribute('aria-label') || srcNode.getAttribute('download') || href);
        const looksFile = srcNode.hasAttribute('download') || /\b(download|attachment|file|uploaded|sandbox|artifact)\b/i.test(text) || /\.(pdf|docx?|xlsx?|pptx?|csv|txt|zip|json|js|ts|py|html|css|png|jpe?g|gif|webp|mp4|mov|mp3|wav)(\?|#|$)/i.test(href);
        if (href && looksFile) uniquePush(assets, { kind: 'file/link', title: text || href, url: href, messageIndex: messageIndex + 1 });
      } else if (tag === 'CANVAS') {
        try {
          const dataUrl = srcNode.toDataURL('image/png');
          if (dataUrl) {
            const img = document.createElement('img');
            img.src = dataUrl; img.alt = `Canvas capture from message ${messageIndex + 1}`;
            node.replaceWith(img);
            uniquePush(assets, { kind: 'canvas-image', title: img.alt, embedded: true, messageIndex: messageIndex + 1 });
          }
        } catch (_) {}
      }
    }
  }

  async function cloneForExport(el, messageIndex) {
    const assets = [];
    const clone = el.cloneNode(true);
    await convertInteractiveFileButtons(clone, el, assets, messageIndex);
    clone.querySelectorAll(DROP_SELECTOR).forEach(n => n.remove());
    await prepareMedia(clone, el, assets, messageIndex);
    clone.querySelectorAll('[aria-label]').forEach(el => {
      const label = cleanText(el.getAttribute('aria-label') || '');
      const captured = el.querySelector('[data-ai-export-captured="interactive-download-label"]');
      if (label && captured && cleanText(captured.textContent || '') === label) el.replaceWith(captured);
    });
    clone.querySelectorAll('*').forEach(n => {
      if (n.hasAttribute('style')) {
        const style = n.getAttribute('style') || '';
        if (/max-height|overflow|position/i.test(style)) n.removeAttribute('style');
      }
      [...n.attributes].forEach(a => {
        if (KEEP_ATTRS.has(a.name) || a.name.startsWith('data-original') || a.name.startsWith('data-ai-')) return;
        n.removeAttribute(a.name);
      });
      if (n.tagName === 'A') {
        n.setAttribute('href', absoluteUrl(n.getAttribute('href') || '#'));
        n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer');
      }
    });
    return { clone, assets: dedupeAssets(assets) };
  }
  function cleanHtml(html) {
    const t = document.createElement('template');
    t.innerHTML = html || '';
    t.content.querySelectorAll('*').forEach(el => {
      if (!ALLOWED_TAGS.has(el.tagName)) el.replaceWith(...el.childNodes);
    });
    return t.innerHTML.trim().replace(/<div>\s*<\/div>/g, '').replace(/<span>\s*<\/span>/g, '').replace(/\n{3,}/g, '\n\n');
  }
  async function htmlFromElement(el, messageIndex) {
    const { clone, assets } = await cloneForExport(el, messageIndex);
    let html = cleanHtml(clone.innerHTML);
    const text = cleanText(clone.innerText || clone.textContent);
    if (!html && text) html = `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
    return { html, text, assets };
  }
  async function pushMessage(messages, role, content) {
    const messageIndex = messages.length;
    const prepared = await htmlFromElement(content, messageIndex);
    const text = cleanText((content?.innerText || content?.textContent || prepared.text || '')).replace(/^Claude responded:\s*/i, '').trim();
    const finalText = text || prepared.assets.map(a => a.title || a.url || a.kind).filter(Boolean).join('\n');
    if (!finalText && !prepared.html) return;
    if (/^(Skip to content|Chat history|New chat\nSearch chats)/i.test(finalText)) return;
    messages.push({ role, html: prepared.html, text: finalText, assets: prepared.assets });
  }

  function markdownishToHtml(text) {
    const blocks = cleanText(text).split(/\n{2,}/).filter(Boolean);
    return blocks.map(block => {
      if (/^```/.test(block)) return `<pre><code>${escapeHtml(block.replace(/^```\w*\n?|```$/g, ''))}</code></pre>`;
      const lines = block.split('\n').filter(Boolean);
      if (lines.length > 1 && lines.every(l => /^\s*[-*]\s+/.test(l))) return `<ul>${lines.map(l => `<li>${escapeHtml(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`;
      if (lines.length > 1 && lines.every(l => /^\s*\d+[.)]\s+/.test(l))) return `<ol>${lines.map(l => `<li>${escapeHtml(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`;
      return `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
  }
  function decodeChatGPTStreamArray(arr) {
    const cache = new Map();
    const decRef = (i, depth = 0) => {
      if (typeof i !== 'number' || i < 0 || depth > 300) return null;
      if (cache.has(i)) return cache.get(i);
      const val = decVal(arr[i], depth + 1); cache.set(i, val); return val;
    };
    const decVal = (val, depth = 0) => {
      if (Array.isArray(val)) return val.map(v => typeof v === 'number' ? decRef(v, depth + 1) : decVal(v, depth + 1));
      if (val && typeof val === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(val)) {
          const key = /^_\d+$/.test(k) ? decRef(Number(k.slice(1)), depth + 1) : k;
          out[key] = typeof v === 'number' ? decRef(v, depth + 1) : decVal(v, depth + 1);
        }
        return out;
      }
      return val;
    };
    return decRef(0);
  }
  function chatGPTPartText(part) {
    if (typeof part === 'string') return part;
    if (!part || typeof part !== 'object') return '';
    if (typeof part.text === 'string') return part.text;
    if (typeof part.content === 'string') return part.content;
    if (Array.isArray(part.parts)) return part.parts.map(chatGPTPartText).filter(Boolean).join('\n\n');
    return '';
  }
  function chatGPTPartAssets(part, messageIndex) {
    const out = [];
    const visit = (x) => {
      if (!x || typeof x !== 'object') return;
      const url = x.url || x.asset_url || x.image_url?.url || x.image_url || x.download_url || x.file_url || x.thumbnail_url || '';
      const name = x.name || x.filename || x.file_name || x.title || x.mime_type || 'ChatGPT asset';
      const kind = /image/i.test(x.content_type || x.mime_type || x.type || '') || /image|thumbnail/i.test(Object.keys(x).join(' ')) ? 'image' : 'file';
      if (url) uniquePush(out, { kind, title: name, url: absoluteUrl(url), messageIndex: messageIndex + 1 });
      if (Array.isArray(x.parts)) x.parts.forEach(visit);
      for (const v of Object.values(x)) if (v && typeof v === 'object') visit(v);
    };
    visit(part);
    return out;
  }
  function extractChatGPTSharedData(provider) {
    const scripts = [...document.scripts].map(s => s.textContent || '').filter(t => t.includes('serverResponse') && t.includes('mapping'));
    for (const script of scripts) {
      try {
        const m = script.match(/streamController\.enqueue\(("[\s\S]*?")\);?$/);
        if (!m) continue;
        const arr = JSON.parse(JSON.parse(m[1]));
        const root = decodeChatGPTStreamArray(arr);
        const route = root?.loaderData?.['routes/share.$shareId.($action)'];
        const data = route?.serverResponse?.data || route?.serverResponse || null;
        const linear = data?.linear_conversation || [];
        const messages = [];
        for (const node of linear) {
          const msg = node?.message;
          const rawRole = msg?.author?.role;
          if (!msg || !['user', 'assistant'].includes(rawRole)) continue;
          if (msg?.metadata?.is_visually_hidden_from_conversation) continue;
          const parts = msg?.content?.parts || [];
          const text = cleanText(parts.map(chatGPTPartText).filter(Boolean).join('\n\n'));
          const assets = parts.flatMap(p => chatGPTPartAssets(p, messages.length));
          if (!text && !assets.length) continue;
          const role = rawRole === 'user' ? 'You' : provider.assistant;
          messages.push({ role, html: markdownishToHtml(text), text: text || assets.map(a => a.title || a.url).join('\n'), assets: dedupeAssets(assets) });
        }
        if (messages.length) return messages;
      } catch (_) {}
    }
    return [];
  }

  async function extractChatGPTDOM(provider) {
    const roots = [...document.querySelectorAll('section[data-testid^="conversation-turn"], [data-turn][data-turn-id-container]')];
    const messages = [];
    const seen = new Set();
    for (const root of roots) {
      if (seen.has(root)) continue; seen.add(root);
      const roleAttr = root.getAttribute('data-turn') || root.querySelector('[data-message-author-role]')?.getAttribute('data-message-author-role') || '';
      const role = /user/i.test(roleAttr) ? 'You' : provider.assistant;
      const content = role === 'You'
        ? (root.querySelector('[data-message-author-role="user"]') || root.querySelector('.whitespace-pre-wrap') || root)
        : (root.querySelector('[data-message-author-role="assistant"] .markdown') || root.querySelector('.markdown') || root.querySelector('[data-message-author-role="assistant"]') || root);
      await pushMessage(messages, role, content);
    }
    if (!messages.length) {
      for (const el of [...document.querySelectorAll('[data-message-author-role], .markdown')]) {
        const role = el.getAttribute('data-message-author-role') === 'user' ? 'You' : provider.assistant;
        await pushMessage(messages, role, el);
      }
    }
    return messages.filter(m => !/^Messages beyond this point are only visible to you\.?$/i.test(m.text));
  }
  async function extractChatGPT(provider) {
    const fromDOM = await extractChatGPTDOM(provider);
    const fromSharedData = extractChatGPTSharedData(provider);
    if (fromDOM.length >= fromSharedData.length) return fromDOM;
    return fromSharedData.length ? fromSharedData : fromDOM;
  }
  async function extractClaude(provider) {
    const nodes = [...document.querySelectorAll('div[data-testid="user-message"], div[data-is-streaming], [data-testid*="message"]')];
    const messages = [];
    const seen = new Set();
    for (const node of nodes) {
      if (seen.has(node) || node.closest('nav, aside')) continue; seen.add(node);
      const isUser = node.matches('div[data-testid="user-message"]') || /user/i.test(node.getAttribute('data-testid') || '');
      let content = node;
      if (!isUser) content = node.querySelector('.font-claude-response') || node.querySelector('.standard-markdown') || node;
      const raw = cleanText(content.innerText || content.textContent).replace(/^Claude responded:\s*/i, '').trim();
      if (!raw || /^Searched the web$/i.test(raw)) continue;
      await pushMessage(messages, isUser ? 'You' : provider.assistant, content);
    }
    return messages;
  }
  async function extractGemini(provider) {
    const messages = [];
    for (const el of [...document.querySelectorAll('user-query-content, message-content')]) {
      const role = el.tagName.toLowerCase() === 'user-query-content' ? 'You' : provider.assistant;
      await pushMessage(messages, role, el);
    }
    return messages;
  }
  async function extractConversation() {
    const provider = providerFromHost();
    const extractors = { chatgpt: extractChatGPT, claude: extractClaude, gemini: extractGemini };
    let messages = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      messages = await (extractors[provider.id] || (async () => []))(provider);
      if (messages.length) break;
      await new Promise(resolve => setTimeout(resolve, 350));
    }
    if (!messages.length) throw new Error(`No loaded conversation messages found on ${location.hostname}. Wait for the chat to finish loading, then try again.`);
    return { provider: provider.label, title: titleFromPage(provider), url: location.href, extractedAt: new Date().toISOString(), exporterVersion: EXPORTER_VERSION, messages };
  }

  function renderAssetList(assets = []) {
    if (!assets.length) return '';
    return `<div class="asset-list"><h4>Attachments / media</h4>${dedupeAssets(assets).map(a => {
      const title = escapeHtml(a.title || a.name || a.url || a.kind);
      const url = a.url ? attr(a.url) : '';
      if (a.kind === 'image' && url) return `<figure class="asset-card"><img src="${url}" alt="${title}"/><figcaption>${title}</figcaption></figure>`;
      return `<p class="asset-card"><strong>${escapeHtml(a.kind || 'asset')}:</strong> ${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>` : title}${a.embedded ? ' <span>(embedded)</span>' : ''}</p>`;
    }).join('')}</div>`;
  }
  function assetCategory(kind = '') {
    const k = String(kind || '').toLowerCase();
    if (k.includes('image') || k.includes('canvas')) return 'images';
    if (k.includes('video')) return 'video';
    if (k.includes('audio')) return 'audio';
    if (k.includes('file')) return 'files';
    if (k.includes('link')) return 'links';
    return 'files';
  }
  function renderAssetSidebar(data) {
    const assets = dedupeAssets(data.messages.flatMap((m, i) => (m.assets || []).map(a => ({ ...a, messageIndex: a.messageIndex || i + 1 }))));
    if (!assets.length) return '<aside class="asset-rail empty" aria-label="Captured assets"><button class="rail-toggle" type="button" aria-label="Collapse asset rail" title="Collapse asset rail"></button><div class="rail-inner"><div class="rail-kicker">Assets</div><p>No files or media captured.</p></div></aside>';
    const groups = [
      ['files', 'Files'],
      ['images', 'Images'],
      ['video', 'Video'],
      ['audio', 'Audio'],
      ['links', 'Links']
    ].map(([id, label]) => ({ id, label, items: assets.filter(a => assetCategory(a.kind) === id) }));
    const row = (a) => {
      const title = escapeHtml(a.title || a.name || a.url || 'Untitled');
      const url = a.url ? attr(a.url) : '';
      const downloadAttr = /file/i.test(a.kind || '') ? ` download="${attr((a.title || 'asset').replace(/[\\/:*?\"<>|]+/g, '-'))}"` : '';
      const message = `Msg ${escapeHtml(a.messageIndex)}`;
      const downloadTitle = attr(a.downloadTitle || a.title || '');
      const sourceDownload = !url && /file\/button/i.test(a.kind || '') && downloadTitle
        ? `<a class="asset-source-original" href="${attr(data.url)}" target="_blank" rel="noopener noreferrer">Open original chat</a>`
        : '';
      const thumbSrc = /image|canvas/i.test(a.kind || '') ? (a.url || '') : '';
      const glyph = assetCategory(a.kind) === 'video' ? 'VID' : assetCategory(a.kind) === 'audio' ? 'AUD' : assetCategory(a.kind) === 'links' ? 'URL' : 'FILE';
      const thumb = thumbSrc
        ? `<a class="asset-thumb" href="${attr(thumbSrc)}" target="_blank" rel="noopener noreferrer"><img src="${attr(thumbSrc)}" alt="${title}" loading="lazy"/></a>`
        : `<div class="asset-glyph" aria-hidden="true">${glyph}</div>`;
      return `<li class="asset-row">${thumb}<div class="asset-row-body"><div class="asset-row-title">${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer"${downloadAttr}>${title}</a>` : title}</div>${sourceDownload}<div class="asset-row-meta">${message}${a.embedded ? ' · embedded' : a.url ? ' · linked' : sourceDownload ? ' · Requires ChatGPT' : ''}${a.mime ? ` · ${escapeHtml(a.mime)}` : ''}</div></div></li>`;
    };
    return `<aside class="asset-rail" aria-label="Captured assets"><button class="rail-toggle" type="button" aria-label="Collapse asset rail" title="Collapse asset rail"></button><div class="rail-inner"><div class="rail-head"><div class="rail-kicker">Assets</div><div class="rail-title-line"><h2>Captured</h2><strong>${assets.length}</strong></div></div><p class="rail-note">Files and media pulled from the visible conversation. Protected ChatGPT files require opening the original chat.</p>${groups.map(g => `<details class="asset-group" ${g.items.length ? '' : 'disabled'}><summary><span>${escapeHtml(g.label)}</span><strong>${g.items.length}</strong></summary>${g.items.length ? `<ul>${g.items.map(row).join('')}</ul>` : '<p class="asset-empty">None</p>'}</details>`).join('')}</div></aside>`;
  }
  function renderStandaloneHTML(data) {
    const assetCount = dedupeAssets(data.messages.flatMap((m, i) => (m.assets || []).map(a => ({ ...a, messageIndex: a.messageIndex || i + 1 })))).length;
    const msgHtml = data.messages.map((m, i) => `<article class="message ${m.role === 'You' ? 'user' : 'assistant'}"><div class="turn-meta"><span>${String(i + 1).padStart(2, '0')}</span><strong>${escapeHtml(m.role)}</strong></div><div class="bubble"><div class="content">${m.html || renderAssetList(m.assets)}</div>${m.assets?.length ? `<footer>${m.assets.length} captured asset${m.assets.length === 1 ? '' : 's'}</footer>` : ''}</div></article>`).join('\n');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(data.title)}</title><style>:root{--bg:#f6f7f9;--rail:#edeff3;--panel:#fff;--ink:#141821;--muted:#667085;--faint:#98a2b3;--line:#d9dee7;--line-soft:#e9edf3;--user:#eef5ff;--accent:#255fd6;--code:#0f172a;--shadow:0 18px 50px rgba(20,24,33,.08);--radius:18px}*{box-sizing:border-box}html{scroll-behavior:smooth}html,body{height:100%;overflow:hidden}body{margin:0;background:var(--bg);color:var(--ink);font:15.5px/1.68 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}a{color:var(--accent);text-decoration-thickness:.08em;text-underline-offset:3px}.layout{height:100vh;display:grid;grid-template-columns:264px minmax(0,1fr);transition:grid-template-columns .22s ease;overflow:hidden}.layout.rail-collapsed{grid-template-columns:48px minmax(0,1fr)}.asset-rail{background:var(--rail);border-right:1px solid var(--line);height:100vh;min-height:0;position:relative;display:grid;grid-template-rows:56px minmax(0,1fr);overflow:hidden}.rail-toggle{position:relative;top:auto;z-index:2;width:28px;height:28px;margin:14px 19px 0 auto;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--accent);box-shadow:0 8px 20px rgba(20,24,33,.08);display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;cursor:pointer;padding:0}.rail-toggle:before{content:"";width:8px;height:8px;border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);transform:rotate(45deg) translate(1px,-1px)}.layout.rail-collapsed .rail-toggle:before{transform:rotate(225deg) translate(1px,-1px)}.rail-toggle:hover{background:#f8fafc}.rail-inner{min-height:0;overflow:auto;padding:10px 16px 22px;overscroll-behavior:contain}.layout.rail-collapsed .rail-inner{padding:10px 0 0;overflow:hidden}.layout.rail-collapsed .rail-toggle{margin:14px auto 0}.layout.rail-collapsed .rail-head,.layout.rail-collapsed .rail-note,.layout.rail-collapsed .asset-group{display:none}.layout.rail-collapsed .rail-inner:before{content:'Assets';writing-mode:vertical-rl;transform:rotate(180deg);display:block;margin:0 auto;color:var(--accent);font:850 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.14em}.rail-head{display:block;margin-bottom:14px}.rail-title-line{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:5px}.rail-kicker{color:var(--accent);font:800 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.12em}.rail-head h2{margin:0;font-size:24px;line-height:1;letter-spacing:-.04em}.rail-head strong{min-width:34px;height:28px;padding:0 9px;border-radius:999px;background:var(--ink);color:#fff;display:grid;place-items:center;font-size:12px}.rail-note{margin:0 0 18px;color:var(--muted);font-size:12px;line-height:1.45}.asset-group{border-top:1px solid var(--line);padding:2px 0}.asset-group:last-child{border-bottom:1px solid var(--line)}.asset-group[disabled]{opacity:.45}.asset-group>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 0;font-weight:850}.asset-group>summary::-webkit-details-marker{display:none}.asset-group>summary span{display:flex;align-items:center;gap:8px}.asset-group>summary span:before{content:'+';width:18px;height:18px;border-radius:50%;border:1px solid var(--line);display:inline-flex;align-items:center;justify-content:center;color:var(--accent);font:800 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;transform:translateY(-1px)}.asset-group[open]>summary span:before{content:'−';font-size:14px;line-height:1}.asset-group>summary strong{font-size:12px;color:var(--muted);font-weight:800}.asset-group ul{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:6px}.asset-row{display:grid;grid-template-columns:38px minmax(0,1fr);gap:9px;align-items:center;margin:0;padding:8px;border-radius:12px;background:rgba(255,255,255,.58);border:1px solid rgba(217,222,231,.72)}.asset-thumb,.asset-glyph{width:38px;height:38px;border-radius:10px;border:1px solid var(--line);background:#fff;display:grid;place-items:center;overflow:hidden;color:var(--accent);font:850 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-decoration:none}.asset-thumb img{width:100%;height:100%;object-fit:cover;border:0;border-radius:0}.asset-row-title{font-size:12px;font-weight:800;line-height:1.25;overflow-wrap:anywhere}.asset-row-title a{color:var(--ink);text-decoration:none}.asset-row-title a:hover{text-decoration:underline}.asset-row-meta,.asset-empty{font-size:10.5px;color:var(--muted)}.asset-source-original{margin:6px 0 2px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--accent);font:750 11px/1 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;padding:6px 9px;cursor:pointer;text-decoration:none;display:inline-block}.asset-source-original:hover{background:#f8fafc}.asset-empty{margin:0 0 10px 27px}.page{width:100%;height:100vh;overflow:auto;margin:0;padding:42px 30px 72px;overscroll-behavior:contain}.hero,.conversation,.footer{width:min(100%,940px);margin-left:auto;margin-right:auto}.hero{padding:0 0 28px;border-bottom:1px solid var(--line)}.eyebrow{color:var(--accent);font:850 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.12em}.hero h1{font-size:clamp(34px,4.8vw,58px);line-height:1;letter-spacing:-.055em;margin:12px 0 18px;max-width:840px}.meta{display:flex;flex-wrap:wrap;gap:8px;color:var(--muted);font-size:13px}.pill{border:1px solid var(--line);background:rgba(255,255,255,.72);border-radius:999px;padding:7px 11px;text-decoration:none;color:var(--muted)}.conversation{display:grid;gap:24px;margin-top:30px}.message{display:grid;grid-template-columns:96px minmax(0,1fr);gap:18px;align-items:start}.turn-meta{position:sticky;top:22px;color:var(--muted);font-size:12px;line-height:1.2;padding-top:4px}.turn-meta span{display:block;color:var(--faint);font:800 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;margin-bottom:7px}.turn-meta strong{font-weight:850}.bubble{background:var(--panel);border:1px solid var(--line-soft);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden}.user .bubble{background:linear-gradient(180deg,#f7fbff,var(--user))}.content{padding:24px 26px}.bubble footer{border-top:1px solid var(--line-soft);padding:10px 26px;color:var(--muted);font-size:12px;background:#fafbfc}.content>*:first-child{margin-top:0}.content>*:last-child{margin-bottom:0}p{margin:0 0 15px}ul,ol{padding-left:24px;margin:0 0 18px}li{margin:6px 0}h2{font-size:25px;letter-spacing:-.025em;margin:26px 0 10px}h3{font-size:19px;margin:22px 0 8px}pre{max-width:100%;overflow:auto;background:var(--code);color:#dbeafe;border-radius:14px;padding:16px;font-size:13px;line-height:1.5}code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}table{width:100%;border-collapse:collapse;margin:18px 0;display:block;overflow:auto}th,td{border:1px solid var(--line);padding:8px 10px;text-align:left}blockquote{border-left:3px solid var(--accent);padding-left:14px;color:#344054;margin:18px 0}img,video{max-width:100%;height:auto;border-radius:14px;border:1px solid var(--line);background:#fff}audio{width:100%}figure{margin:16px 0}figcaption,.asset-meta{color:var(--muted);font-size:13px}.asset-list{margin-top:16px;padding:14px;border:1px solid var(--line);border-radius:14px;background:#fafbfc}.asset-list h4{margin:0 0 10px}.asset-card{margin:10px 0}.footer{margin-top:34px;padding-top:18px;border-top:1px solid var(--line);color:var(--muted);font-size:13px}@media (max-width:980px){.layout,.layout.rail-collapsed{grid-template-columns:1fr}.asset-rail{min-height:auto;border-right:0;border-bottom:1px solid var(--line)}.rail-toggle{display:none}.layout.rail-collapsed .rail-head,.layout.rail-collapsed .rail-note,.layout.rail-collapsed .asset-group{display:block}.layout.rail-collapsed .rail-inner:before{display:none}.rail-inner,.layout.rail-collapsed .rail-inner{position:relative;max-height:none;padding:16px;overflow:auto}.page{padding:34px 18px 62px}.message{grid-template-columns:1fr}.turn-meta{position:relative;top:auto;display:flex;gap:8px;align-items:center}.turn-meta span{margin:0}.hero h1{font-size:clamp(34px,11vw,54px)}}@media print{html,body{height:auto;overflow:visible}body{background:#fff}.layout{display:block;height:auto;overflow:visible}.asset-rail{display:none}.page{width:auto;max-width:none;height:auto;overflow:visible;padding:0}.hero,.bubble{box-shadow:none}.turn-meta{position:relative;top:auto}}</style></head><body><div class="layout">${renderAssetSidebar(data)}<main class="page"><section class="hero"><div class="eyebrow">${escapeHtml(data.provider)} export</div><h1>${escapeHtml(data.title)}</h1><div class="meta"><span class="pill">${data.messages.length} messages</span><span class="pill">${assetCount} rich items</span><span class="pill">${escapeHtml(data.extractedAt)}</span><a class="pill" href="${attr(data.url)}" target="_blank" rel="noopener noreferrer">Original conversation</a></div></section><section class="conversation">${msgHtml}</section></main></div><script>(function(){var layout=document.querySelector('.layout');var btn=document.querySelector('.rail-toggle');if(!layout||!btn)return;layout.classList.remove('rail-collapsed');btn.setAttribute('aria-label','Collapse asset rail');btn.setAttribute('title','Collapse asset rail');btn.addEventListener('click',function(){var collapsed=layout.classList.toggle('rail-collapsed');btn.setAttribute('aria-label',collapsed?'Expand asset rail':'Collapse asset rail');btn.setAttribute('title',collapsed?'Expand asset rail':'Collapse asset rail');});})();</script></body></html>`;
  }
  function stableConversationFingerprint(data) {
    return JSON.stringify({ provider: data.provider, messages: data.messages.map(m => ({ role: m.role, text: cleanText(m.text || ''), assets: (m.assets || []).map(a => ({ kind: a.kind, title: a.title, url: a.url, embedded: !!a.embedded })) })) });
  }
  function legacyConversationFingerprint(data) {
    return JSON.stringify({ provider: data.provider, title: data.title, url: data.url, messages: data.messages.map(m => ({ role: m.role, text: cleanText(m.text || '') })) });
  }
  async function exportCurrentPage() {
    const data = await extractConversation();
    const fingerprint = stableConversationFingerprint(data);
    const legacyFingerprint = legacyConversationFingerprint(data);
    const html = renderStandaloneHTML(data);
    return { ok: true, provider: data.provider, title: data.title, count: data.messages.length, richCount: data.messages.reduce((n,m)=>n+(m.assets?.length||0),0), fingerprint, legacyFingerprint, html };
  }

  if (typeof chrome !== 'undefined' && chrome?.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type === 'AI_EXPORT_PING') { sendResponse({ ok: true, version: EXPORTER_VERSION }); return true; }
      if (msg?.type === 'AI_EXPORT_LIST_FILE_BUTTON_TARGETS') { sendResponse({ ok: true, targets: listInteractiveFileButtonTargets() }); return true; }
      if (msg?.type === 'AI_EXPORT_REMEMBER_FILE_URL') { sendResponse({ ok: rememberFileUrl(msg.title || '', msg.key || '', msg.url || '') }); return true; }
      if (msg?.type === 'AI_EXPORT_CLICK_FILE_BUTTON') { sendResponse(clickInteractiveFileButton(msg.title || '', msg.key || '')); return true; }
      if (msg?.type !== 'AI_EXPORT_HTML') return false;
      exportCurrentPage().then(sendResponse).catch(err => sendResponse({ ok: false, error: err.message || String(err) }));
      return true;
    });
  }
  window.AIHTMLExporter = { extractConversation, renderStandaloneHTML, exportCurrentPage, _internals: { extractChatGPT, extractClaude, extractGemini, providerFromHost } };
})();
