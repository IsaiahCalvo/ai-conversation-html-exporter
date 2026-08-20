#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const viewerJs = fs.readFileSync(path.join(root, 'viewer.js'), 'utf8');

const listeners = new Map();
const statusEl = { textContent: 'Loading…', addEventListener() {} };
const frame = {
  srcdoc: '',
  contentWindow: { focus() {}, print() {} },
  addEventListener(_name, cb) { this._load = cb; }
};
function button(id) {
  return {
    id,
    textContent: '',
    disabled: false,
    title: '',
    setAttribute(name, value) { this[name] = value; },
    focus() {},
    addEventListener(type, cb) { listeners.set(`${id}:${type}`, cb); },
    removeEventListener(type, cb) { if (listeners.get(`${id}:${type}`) === cb) listeners.delete(`${id}:${type}`); },
    click() { const cb = listeners.get(`${id}:click`); if (cb) cb({ type: 'click', stopPropagation() {}, target: this }); }
  };
}
function panel(id) {
  const classes = new Set();
  return {
    id,
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle: (name, force) => {
        const on = force === undefined ? !classes.has(name) : Boolean(force);
        if (on) classes.add(name); else classes.delete(name);
        return on;
      }
    },
    contains: () => false,
    setAttribute(name, value) { this[name] = value; },
    addEventListener(type, cb) { listeners.set(`${id}:${type}`, cb); }
  };
}
const publishMenu = panel('publishMenu');
const consentDialog = panel('consentDialog');
const localStore = {};
const publishedMessages = [];
const elements = {
  frame,
  title: { textContent: '' },
  status: statusEl,
  original: button('original'),
  download: button('download'),
  pdf: button('pdf'),
  share: button('share'),
  publish: button('publish'),
  publishMenu,
  publishMenuToggle: button('publishMenuToggle'),
  goPublished: button('goPublished'),
  consentDialog,
  consentAccept: button('consentAccept'),
  consentCancel: button('consentCancel')
};
const windowListeners = new Map();
const unhandled = [];
const clipboardWrites = [];
process.on('unhandledRejection', (reason) => { unhandled.push(reason); });

class FilePolyfill extends Blob {
  constructor(parts, name, opts) { super(parts, opts); this.name = name; this.lastModified = Date.now(); }
}
class DOMParserMock {
  parseFromString(raw) {
    return {
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ setAttribute() {} }),
      head: { prepend() {} },
      documentElement: { outerHTML: String(raw).replace(/^<!doctype html>\s*/i, '') }
    };
  }
}

const context = {
  console,
  setTimeout: (cb) => { cb(); return 1; },
  clearTimeout() {},
  URL,
  URLSearchParams,
  Blob,
  File: global.File || FilePolyfill,
  DOMException,
  DOMParser: DOMParserMock,
  location: { search: '?id=test&mode=html&hash=x&legacyHash=y&sourceTabId=123' },
  history: { replaceState() {} },
  document: {
    title: '',
    getElementById: (id) => elements[id],
    createElement: () => ({ click() {} }),
    addEventListener(type, cb) { listeners.set(`document:${type}`, cb); },
    removeEventListener(type, cb) { if (listeners.get(`document:${type}`) === cb) listeners.delete(`document:${type}`); }
  },
  window: {
    addEventListener(type, cb) { windowListeners.set(type, cb); }
  },
  navigator: {
    canShare: () => true,
    share: () => Promise.reject(new DOMException('Share canceled', 'AbortError')),
    clipboard: { writeText: async (text) => { clipboardWrites.push(text); } }
  },
  TextEncoder,
  fetch: async () => { throw new Error('fetch should not be called in this test'); },
  chrome: {
    runtime: {
      getURL: (p) => `chrome-extension://test/${p}`,
      sendMessage: (msg) => {
        publishedMessages.push(msg);
        if (msg?.type === 'AI_EXPORT_PUBLISH_HERENOW') {
          return Promise.resolve({ ok: true, url: 'https://latest-test.here.now/', claimUrl: 'https://here.now/claim?secret=hidden' });
        }
        return Promise.resolve({ ok: true });
      }
    },
    storage: {
      local: {
        get: async (key) => {
          const name = typeof key === 'string' ? key : Object.keys(key || {})[0];
          return name && localStore[name] ? { [name]: localStore[name] } : {};
        },
        set: async (values) => { Object.assign(localStore, values); }
      },
      session: {
        get: async () => ({
          'export:test': {
            html: '<!doctype html><html><head></head><body><a>Original Conversation</a><main>Hello</main></body></html>',
            title: 'Harness Conversation',
            provider: 'AI',
            count: 1,
            sourceUrl: 'https://chatgpt.com/share/example',
            sourceTabId: 123
          }
        }),
        remove: async () => {}
      }
    },
    tabs: {
      get: async () => ({ id: 123, windowId: 1, url: 'https://chatgpt.com/share/example' }),
      update: async () => ({}),
      query: async () => [],
      create: async () => ({})
    },
    windows: { update: async () => ({}) }
  }
};
context.window.window = context.window;
context.window.document = context.document;
context.window.navigator = context.navigator;
context.window.location = context.location;
context.globalThis = context;

(async () => {
  vm.createContext(context);
  vm.runInContext(viewerJs, context, { filename: 'viewer.js' });
  for (let i = 0; i < 10 && statusEl.textContent === 'Loading…'; i++) {
    await new Promise(resolve => setImmediate(resolve));
  }

  elements.share.click();
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));

  if (unhandled.length) {
    console.error('FAIL unhandled rejection:', unhandled.map(e => `${e.name || ''}: ${e.message || e}`).join('; '));
    process.exit(1);
  }
  if (statusEl.textContent !== 'Share cancelled.') {
    console.error(`FAIL status was ${JSON.stringify(statusEl.textContent)}`);
    process.exit(1);
  }
  elements.publish.click();
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  if (!consentDialog.classList.contains('open')) {
    console.error('FAIL first publish did not open the one-time consent dialog');
    process.exit(1);
  }
  if (publishedMessages.some(msg => msg?.type === 'AI_EXPORT_PUBLISH_HERENOW')) {
    console.error('FAIL publish uploaded before consent was accepted');
    process.exit(1);
  }
  elements.consentCancel.click();
  await new Promise(resolve => setImmediate(resolve));
  if (consentDialog.classList.contains('open')) {
    console.error('FAIL cancel did not close the consent dialog');
    process.exit(1);
  }
  if (statusEl.textContent !== 'Publish cancelled.') {
    console.error(`FAIL cancel status was ${JSON.stringify(statusEl.textContent)}`);
    process.exit(1);
  }
  elements.publish.click();
  await new Promise(resolve => setImmediate(resolve));
  elements.consentAccept.click();
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  if (!localStore.hereNowPublishConsent) {
    console.error('FAIL accepting consent did not persist one-time consent');
    process.exit(1);
  }
  if (!publishMenu.classList.contains('has-link')) {
    console.error('FAIL publish menu did not become a dropdown after publish');
    process.exit(1);
  }
  elements.publish.click();
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  if (consentDialog.classList.contains('open')) {
    console.error('FAIL consented publish asked for consent again');
    process.exit(1);
  }
  if (publishedMessages.filter(msg => msg?.type === 'AI_EXPORT_PUBLISH_HERENOW').length !== 2) {
    console.error(`FAIL expected two publishes after consent, got ${publishedMessages.filter(msg => msg?.type === 'AI_EXPORT_PUBLISH_HERENOW').length}`);
    process.exit(1);
  }
  if (statusEl.textContent !== '' || /claim|Published|copied|latest-test/i.test(statusEl.textContent)) {
    console.error(`FAIL publish should stay visually quiet, status was ${JSON.stringify(statusEl.textContent)}`);
    process.exit(1);
  }
  elements.publishMenuToggle.click();
  if (!publishMenu.classList.contains('open')) {
    console.error('FAIL publish dropdown did not open');
    process.exit(1);
  }
  elements.goPublished.click();
  await new Promise(resolve => setImmediate(resolve));
  if (statusEl.textContent !== '') {
    console.error(`FAIL Copy should stay visually quiet, status was ${JSON.stringify(statusEl.textContent)}`);
    process.exit(1);
  }
  if (clipboardWrites.at(-1) !== 'https://latest-test.here.now/') {
    console.error(`FAIL Copy dropdown did not copy latest link: ${JSON.stringify(clipboardWrites)}`);
    process.exit(1);
  }
  const htmlUi = fs.readFileSync(path.join(root, 'viewer.html'), 'utf8') + fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
  if (/MDX|Copy HTML|Markdown|Go to link|Open latest publish/.test(htmlUi)) {
    console.error('FAIL removed labels still visible in HTML UI');
    process.exit(1);
  }
  console.log('PASS viewer share, publish dropdown, and latest-link handling');
})();
