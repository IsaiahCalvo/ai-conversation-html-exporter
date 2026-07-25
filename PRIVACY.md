# Privacy Policy

**Effective date:** July 25, 2026

AI Conversation HTML Exporter converts conversations that you choose from ChatGPT, Claude, and Gemini into local HTML documents.

## Data the extension accesses

When you invoke the extension on a supported conversation page, it accesses the currently loaded conversation content and visible/accessible rich media needed to create the export. This may include message text, code, tables, links, images, audio, video, and file labels or URLs exposed by the page.

The extension also stores generated exports and minimal source/viewer metadata locally in Chrome extension storage so it can display large exports and reuse an existing viewer tab.

## How data is used

The accessed content is used only to:

- generate the requested HTML or PDF view;
- let you download or locally share the generated HTML;
- focus the original conversation or an existing export viewer; and
- publish a temporary link only when you explicitly request that action.

## Data sharing

By default, conversation processing and export generation happen locally in your browser. The extension does not sell data, use it for advertising, profiling, analytics, creditworthiness, or model training.

If you explicitly click **Publish 24h Link**, the generated standalone HTML is uploaded to the third-party here.now service and its Cloudflare R2 storage so a public link can be created. Anyone with that public link may be able to view the exported conversation. Anonymous here.now links are represented in the extension as expiring after 24 hours unless claimed; third-party handling is governed by those services' terms and privacy policies.

No upload occurs merely by opening the extension, creating an HTML viewer, downloading HTML, printing to PDF, or using native local file sharing.

## Data retention

Local export data remains in Chrome's extension storage until Chrome or the user clears it, the extension is removed, or browser storage is otherwise evicted. Temporary public-link retention is controlled by here.now and its infrastructure.

## Permissions

The extension requests only permissions used for conversation export, local storage/downloads, tab management, and the optional user-initiated publishing feature. Permission justifications are documented in the repository README.

## Security

The extension contains no advertising or analytics SDK. It does not require an account or API key. Users should treat exported HTML and public links as potentially sensitive because they can contain private conversation content.

## Changes

Material changes to this policy will be published in this repository and reflected by updating the effective date.

## Contact

For privacy questions or deletion/support requests, open an issue at:

https://github.com/IsaiahCalvo/ai-conversation-html-exporter/issues
