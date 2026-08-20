# Privacy Policy

**Product:** AI Conversation HTML Exporter  
**Developer:** Isaiah Calvo  
**Effective date:** August 20, 2026  
**Public copy:** https://isaiahcalvo.github.io/ai-conversation-html-exporter/privacy.html  
**Source code:** https://github.com/IsaiahCalvo/ai-conversation-html-exporter

This policy describes how the Chrome extension handles information. It is written to match the shipped code, not an idealized version of it.

The use of information received from Google APIs, and of other user data handled by this extension, adheres to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/#user-data), including the Limited Use requirements.

## What this extension is for

The extension converts a conversation you choose on ChatGPT, Claude, or Gemini into a portable HTML document or a print-ready PDF view. An optional **Publish 24h Link** action can upload that HTML so you get a temporary public URL.

It does not require an account with the developer. It does not include advertising, analytics, crash reporting, or a developer-operated backend.

## What counts as “handling” data

Chrome Web Store rules treat local processing as handling user data. This extension handles data even when nothing leaves your computer.

## Data the extension can access

### Conversation content (website content, user-generated content, and personal communications)

When you click **Create HTML Tab** or **Create PDF** on a supported page, the extension reads the conversation currently loaded in that tab. That can include:

- message text from you and the model
- headings, lists, tables, and code
- links
- images, audio, video, and file names or URLs the page already exposes

The extension only runs this extraction on:

- `https://chatgpt.com/*`
- `https://claude.ai/*`
- `https://gemini.google.com/*`

and only after you invoke it. It does not scrape those sites in the background.

Conversations can contain anything you or the model wrote. If a chat includes names, emails, locations, health details, financial details, or other sensitive material, that material can appear in the export. The extension does not try to detect or strip those categories.

### Media already shown in the chat

To make a standalone HTML file, the extension may fetch images and other media URLs that are already part of the loaded conversation, using your existing logged-in session with that site (`credentials: include`). Those bytes are embedded in the local HTML when the fetch succeeds. The developer does not receive those files. If you later publish the HTML, those embedded files go with it.

### Tab information (web browsing activity, used locally)

To show which site you are on, reopen the original chat, and reuse an existing export tab, the extension can:

- read the active tab’s URL/hostname for the popup
- store the source conversation URL and tab id with the export
- look through open tabs in this Chrome profile to find the original conversation or an existing HTML viewer

Those tab URLs are used only for that navigation/reuse behavior. They are not sent to the developer or to here.now.

### Local export files and consent

The extension stores, on your device:

- generated HTML and related metadata (title, provider, message count, source URL/tab, content hashes) in Chrome extension storage / IndexedDB
- a one-time flag that you agreed to **Publish 24h Link** (`hereNowPublishConsent` in `chrome.storage.local`)

The HTML preview copy is removed from extension storage about 10 minutes after the viewer opens. Session indexes used to reuse a viewer tab last until the browser session ends, you clear extension data, or you remove the extension. The publish-consent flag lasts until you clear extension data or uninstall.

## How the data is used

Accessed content is used only to:

1. build the HTML or PDF view you asked for
2. download or use the operating system’s local share sheet for that HTML file
3. focus the original conversation tab or an existing export tab
4. upload the generated HTML when you explicitly use **Publish 24h Link** after the one-time consent dialog

The extension does not use this data for advertising, analytics, profiling, creditworthiness, lending, or model training. The developer does not get a copy of your chats unless you publish a public link and someone (including the developer) opens that link.

## When data leaves your browser

**Default: it does not.** Opening the extension, creating an HTML tab, downloading HTML, printing to PDF, and native “Share File” stay on the device.

**Optional publish:** the first time you click **Publish 24h Link**, the extension shows a confirmation that the HTML will be uploaded and that anyone with the link can read it. After you accept once, later clicks of that button upload without showing the dialog again.

That upload sends the generated standalone HTML, plus a display title and a short description, to:

- [here.now](https://here.now/) (`https://here.now/api/v1/publish` and here.now finalize URLs)
- Cloudflare R2, using a short-lived upload URL returned by here.now (`https://*.r2.cloudflarestorage.com/*`)

The request identifies this extension with the header `X-HereNow-Client: ai-conversation-html-exporter/chrome-extension`.

Anyone who has the resulting public URL may be able to read the exported conversation, including embedded media. Anonymous here.now links are represented in the product as expiring after 24 hours unless claimed. After upload, retention, access, and deletion are controlled by here.now and Cloudflare, not by this extension. See those services’ own terms and privacy policies.

Transmissions use HTTPS.

## What this extension does not collect

The extension does not:

- create an account or ask for an API key
- sell data
- include ads, analytics, or telemetry SDKs
- load or run remote JavaScript; all executable extension code is in the installed package
- send conversation content to the developer’s servers (there are none)

## Permissions, in plain language

| Permission | Why it exists |
|---|---|
| `activeTab` | Read the conversation tab after you click the extension. |
| Host access to ChatGPT, Claude, and Gemini | Extract the loaded conversation and embed media from those pages. |
| `scripting` | Inject the local `content.js` file if it is not already running. |
| `storage` | Remember viewer/source metadata and the one-time publish consent. |
| `unlimitedStorage` | Keep large HTML exports with embedded media from hitting Chrome’s small default quota. |
| `tabs` | Open the HTML viewer, focus it later, and find the original conversation tab. This can include reading other open tab URLs in this profile for that matching. |
| Host access to `here.now` and `*.r2.cloudflarestorage.com` | Upload HTML only after **Publish 24h Link**. These hosts are not used for ordinary export, download, or PDF. |

## Your choices and deletion

- Do not click **Publish 24h Link** if you do not want a public copy.
- Download or print stays local.
- Remove the extension or clear its data in Chrome to delete local exports and the stored consent flag.
- For a link you already published, use here.now’s expiry/claim behavior; the developer cannot remotely delete your here.now URL.

## Children

This extension is not directed at children. Do not publish conversations that contain a child’s personal information.

## Changes

Material changes will be published in this repository and on the public privacy page, and the effective date will be updated.

## Contact

Privacy questions, access, or deletion requests: [GitHub Issues](https://github.com/IsaiahCalvo/ai-conversation-html-exporter/issues)
