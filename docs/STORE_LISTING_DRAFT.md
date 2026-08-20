# Chrome Web Store Listing Draft

## Name

AI Conversation HTML Exporter

## Short description

Export ChatGPT, Claude, and Gemini conversations to clean standalone HTML or PDF.

## Detailed description

Save the AI conversations you choose as polished, portable documents.

AI Conversation HTML Exporter works with ChatGPT, Claude, and Gemini. Open a conversation, click the extension, and create a clean HTML viewer or print-ready PDF. The generated HTML preserves useful formatting such as headings, lists, tables, code blocks, links, and accessible media.

Features:

- Create a clean HTML viewer in one click
- Download a standalone HTML file
- Save as PDF through Chrome's print dialog
- Return to the original conversation tab
- Avoid duplicate viewer tabs for unchanged exports
- Optional, explicit 24-hour public-link publishing through here.now

Privacy-first behavior:

- HTML creation, downloads, PDF printing, and native file sharing stay local
- No analytics, ads, accounts, API keys, or developer backend
- Nothing is uploaded unless you explicitly click Publish 24h Link
- The first publish asks you to confirm that the HTML becomes a public here.now link; later publishes reuse that consent
- Public links can contain the full exported conversation; publish only what you intend to share
- The extension can read open-tab URLs locally so it can return to the original chat or reuse an export tab; those URLs are not uploaded

The extension exports the conversation currently loaded by the site. For very long conversations, scroll through them first so all messages are loaded.

## Category

Productivity

## Language

English

## Single purpose

Convert user-selected conversations on supported AI chat websites into portable HTML documents and print-ready PDF views.

## Permission justifications

- `activeTab`: access the supported conversation tab after the user invokes the extension.
- `scripting`: inject the local content script when it is not already available.
- `storage`: retain generated export/viewer metadata locally.
- `unlimitedStorage`: support large conversations and embedded media without the small default quota breaking exports.
- `tabs`: create and focus the export viewer, and find the original conversation tab. This can include reading other open tab URLs in the profile so the extension can match the saved source URL or an existing viewer; those URLs stay on-device.
- ChatGPT/Claude/Gemini host permissions: read the supported conversation content and embed media already shown on those pages.
- here.now/Cloudflare R2 host permissions: upload generated HTML only after the user explicitly invokes Publish 24h Link. Not used for ordinary export, download, or PDF.

## Dashboard privacy answers

Remote code: **No.** All executable JavaScript is packaged in the extension. here.now responses are JSON and upload URLs, not code to execute.

Certify Limited Use: **Yes**, consistent with PRIVACY.md.

Disclose every category that can actually appear. Do not under-disclose:

- **Website content** — the loaded ChatGPT/Claude/Gemini conversation, including text and media URLs/files already on the page.
- **Personal communications** and/or **user-generated content** if those checkboxes exist — the chat is a conversation the user chose to export.
- **Web browsing activity** / tab URLs — used locally to show the current site, store the source conversation URL, and find the original tab or an existing viewer. Not transmitted unless the user publishes HTML that itself contains the original conversation URL.
- Do **not** check advertising, analytics, authentication-credential collection, or a developer account system. The extension may use the user's existing site session only to fetch media already visible in that chat for the local HTML.

Privacy policy URL must stay in sync with the public page after each push to `docs/privacy.html`.

## Privacy policy URL

https://isaiahcalvo.github.io/ai-conversation-html-exporter/privacy.html

## Support URL

https://github.com/IsaiahCalvo/ai-conversation-html-exporter/issues

## Homepage URL

https://github.com/IsaiahCalvo/ai-conversation-html-exporter

## Listing images

All files are in `store-assets/` and copied to `~/Desktop/builds/chrome-web-store-upload/`.

- Store icon (128×128, 16px padding): `1-store-icon-128.png`
- Small promo tile (440×280, required): `2-small-promo-440x280.png`
- Marquee promo tile (1400×560, optional): `3-marquee-promo-1400x560.png`
- Screenshot 1 — HTML viewer: `4-screenshot-viewer-1280x800.png`
- Screenshot 2 — extension popup: `5-screenshot-popup-1280x800.png`
- Screenshot 3 — publish consent: `6-screenshot-consent-1280x800.png`

Upload ZIP: `ai-conversation-html-exporter-0.4.23.zip`
