# AI Conversation HTML Exporter

A privacy-conscious Chrome extension that turns conversations from ChatGPT, Claude, and Gemini into clean, standalone HTML documents.

## Features

- Export the currently loaded conversation to a polished HTML viewer
- Download a portable standalone `.html` file
- Create a PDF through Chrome's print dialog
- Preserve formatted text, headings, lists, tables, code, links, and accessible media
- Return to the original conversation tab
- Avoid duplicate viewer tabs for unchanged exports
- Optionally publish an anonymous 24-hour link through [here.now](https://here.now/)

## Supported sites

- `https://chatgpt.com/*`
- `https://claude.ai/*`
- `https://gemini.google.com/*`

## Privacy

Conversation extraction and HTML generation happen locally in Chrome. Nothing is uploaded unless the user explicitly clicks **Publish 24h Link**; that action sends the generated HTML to here.now/Cloudflare R2 to create a temporary public URL.

Read the full [Privacy Policy](PRIVACY.md).

## Install from source

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this repository folder.

## Use

1. Open a conversation in ChatGPT, Claude, or Gemini.
2. Click the extension icon.
3. Choose **Create HTML Tab** or **Create PDF**.
4. In the HTML viewer, download the file, print it, share it locally, or explicitly publish a temporary link.

Long conversations may be virtualized by the source site. Scroll through the conversation first so all messages are loaded before exporting.

## Development

No build step or third-party runtime dependencies are required.

```bash
npm test
npm run package
```

`npm run package` creates a sanitized Chrome Web Store ZIP containing runtime files only. Exported conversations and test fixtures are intentionally excluded.

## Permissions

- `activeTab` and site host permissions: read the supported conversation only when the extension is used
- `scripting`: inject the exporter if the content script is not already available
- `downloads`: save standalone HTML files
- `storage` and `unlimitedStorage`: keep large local export previews in extension storage
- `tabs`: open/focus the generated viewer and return to the source conversation
- `here.now` and Cloudflare R2 host permissions: used only when the user explicitly publishes a 24-hour link

## Limitations

- The extension exports what the page has loaded into its DOM.
- Protected ChatGPT attachments may require opening the original conversation.
- Source-site DOM changes can require selector updates.

## License

[MIT](LICENSE)
