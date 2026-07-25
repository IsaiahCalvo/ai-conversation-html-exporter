#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const backgroundJs = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
let listener;
const calls = [];
const context = {
  console,
  TextEncoder,
  Blob,
  chrome: {
    runtime: {
      onMessage: {
        addListener(fn) { listener = fn; }
      }
    },
    tabs: { get: async () => ({}), update: async () => ({}) },
    windows: { update: async () => ({}) }
  },
  fetch: async (url, opts = {}) => {
    calls.push({ url: String(url), method: opts.method || 'GET', headers: opts.headers || {}, bodyType: opts.body?.constructor?.name || typeof opts.body });
    if (String(url) === 'https://here.now/api/v1/publish') {
      return {
        ok: true,
        json: async () => ({
          siteUrl: 'https://dapper-rafter-8cmn.here.now',
          claimUrl: 'https://here.now/claim/demo',
          upload: {
            versionId: 'v1',
            finalizeUrl: 'https://here.now/api/v1/publish/demo/finalize',
            uploads: [{ path: 'index.html', method: 'PUT', url: 'https://263414d00e3a6cea35ccd465d3093cb3.r2.cloudflarestorage.com/herenow/demo/index.html' }]
          }
        })
      };
    }
    if (String(url).includes('r2.cloudflarestorage.com')) return { ok: true };
    if (String(url).includes('/finalize')) return { ok: true, json: async () => ({ siteUrl: 'https://dapper-rafter-8cmn.here.now' }) };
    throw new Error(`Unexpected fetch ${url}`);
  }
};
context.globalThis = context;

(async () => {
  vm.createContext(context);
  vm.runInContext(backgroundJs, context, { filename: 'background.js' });
  if (typeof listener !== 'function') throw new Error('No message listener registered');

  const response = await new Promise((resolve) => {
    const keepAlive = listener({ type: 'AI_EXPORT_PUBLISH_HERENOW', html: '<!doctype html><h1>ok</h1>', title: 'Test' }, {}, resolve);
    if (keepAlive !== true) throw new Error('Listener did not keep channel alive');
  });

  if (!response.ok || response.url !== 'https://dapper-rafter-8cmn.here.now') {
    console.error('FAIL response', response);
    process.exit(1);
  }
  const methods = calls.map(c => `${c.method}:${new URL(c.url).hostname}`).join(',');
  if (!methods.includes('POST:here.now') || !methods.includes('PUT:263414d00e3a6cea35ccd465d3093cb3.r2.cloudflarestorage.com')) {
    console.error('FAIL calls', calls);
    process.exit(1);
  }
  const put = calls.find(c => c.method === 'PUT');
  if (!put || Object.keys(put.headers).some(k => k.toLowerCase() === 'content-type')) {
    console.error('FAIL PUT should not force a custom Content-Type header', put);
    process.exit(1);
  }
  console.log(`PASS background here.now publish flow mocked; ${methods}`);
})();
