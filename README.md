# AI Conversation HTML Exporter

A Chrome extension that turns conversations from ChatGPT, Claude, and Gemini into clean, standalone HTML documents.

## Features

- Export the currently loaded conversation to a polished HTML viewer
- Download a portable standalone `.html` file
- Create a PDF through Chrome's print dialog
- Preserve formatted text, headings, lists, tables, code, links, and accessible media
- Return to the original conversation tab
- Avoid duplicate viewer tabs for unchanged exports
- Optionally publish an anonymous 24-hour public link through [here.now](https://here.now/), after a one-time confirmation

## Supported sites

- `https://chatgpt.com/*`
- `https://claude.ai/*`
- `https://gemini.google.com/*`

## Privacy (honest summary)

**Required public policy:** [https://isaiahcalvo.github.io/ai-conversation-html-exporter/privacy.html](https://isaiahcalvo.github.io/ai-conversation-html-exporter/privacy.html)

The full text also lives in [PRIVACY.md](PRIVACY.md). Chrome treats local processing as handling user data, so the policy describes on-device behavior as well as the optional upload.

- Conversation extraction and HTML/PDF generation happen in your browser.
- The extension can read the loaded chat (text, layout, and media already on the page) and, locally, tab URLs so it can jump back to the original conversation or reuse an open export tab.
- Nothing is sent to the developer. There is no developer backend, account, ad SDK, or analytics SDK.
- Executable extension code is packaged locally. The extension does not run remote JavaScript.
- **Publish 24h Link** is the only upload. The first use shows a confirmation that the HTML goes to here.now / Cloudflare R2 and that anyone with the link can read it. Later publishes reuse that consent. Do not use it for chats you are not willing to make public.

The use of information received from Google APIs, and of other user data handled by this extension, adheres to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/#user-data), including the Limited Use requirements.

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
4. In the HTML viewer, download the file, print it, share it locally, or publish a temporary link.

Long conversations may be virtualized by the source site. Scroll through the conversation first so all messages are loaded before exporting.

## Development

No build step or third-party runtime dependencies are required.

```bash
npm test
npm run package
```

`npm run package` creates a sanitized Chrome Web Store ZIP containing runtime files only. Exported conversations and test fixtures are intentionally excluded.

## Permissions

| Permission | Why |
|---|---|
| `activeTab` | Read the supported conversation after you click the extension. |
| ChatGPT / Claude / Gemini host access | Extract the loaded conversation and embed media from those pages. |
| `scripting` | Inject the local `content.js` file if it is not already running. |
| `downloads` | Save standalone HTML files. |
| `storage` | Keep viewer/source metadata and the one-time publish consent. |
| `unlimitedStorage` | Hold large local HTML exports with embedded media. |
| `tabs` | Open/focus the viewer and find the original conversation tab. This can read other open tab URLs in this profile for that matching. |
| `here.now` and `*.r2.cloudflarestorage.com` | Used only when you click **Publish 24h Link**. |

## Limitations

- The extension exports what the page has loaded into its DOM.
- Protected ChatGPT attachments may require opening the original conversation.
- Source-site DOM changes can require selector updates.
- A published here.now URL is public to anyone who has it.

## Support

Open an issue at [github.com/IsaiahCalvo/ai-conversation-html-exporter/issues](https://github.com/IsaiahCalvo/ai-conversation-html-exporter/issues).

## License

[MIT](LICENSE)
