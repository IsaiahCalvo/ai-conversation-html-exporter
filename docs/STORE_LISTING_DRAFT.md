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
- No analytics, ads, accounts, or API keys
- Nothing is uploaded unless you explicitly click Publish 24h Link
- Public links can contain sensitive conversation content; publish only what you intend to share

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
- `downloads`: download the generated standalone HTML file.
- `storage`: retain generated export/viewer metadata locally.
- `unlimitedStorage`: support large conversations and embedded media without the small default quota breaking exports.
- `tabs`: create/focus the export viewer and return to the original conversation.
- ChatGPT/Claude/Gemini host permissions: read the supported conversation content required for export.
- here.now/Cloudflare R2 host permissions: upload generated HTML only after the user explicitly invokes Publish 24h Link.

## Privacy policy URL

https://isaiahcalvo.github.io/ai-conversation-html-exporter/privacy.html

## Support URL

https://github.com/IsaiahCalvo/ai-conversation-html-exporter/issues

## Homepage URL

https://github.com/IsaiahCalvo/ai-conversation-html-exporter
