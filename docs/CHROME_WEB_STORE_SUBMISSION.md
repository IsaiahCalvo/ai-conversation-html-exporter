# Chrome Web Store Submission Checklist

Use the current first-party Google documentation linked below; dashboard wording can change.

## Ready artifacts

- Upload ZIP: `dist/ai-conversation-html-exporter-0.4.23.zip`
- Extension icon in ZIP: `icons/icon128.png` (128×128)
- Required screenshot: `store-assets/screenshot-1280x800.png` (1280×800)
- Required small promotional tile: `store-assets/small-promo-440x280.png` (440×280)
- Listing copy and permission justifications: `docs/STORE_LISTING_DRAFT.md`
- Public privacy policy: https://isaiahcalvo.github.io/ai-conversation-html-exporter/privacy.html
- Support URL: https://github.com/IsaiahCalvo/ai-conversation-html-exporter/issues

## Account setup

1. Sign in to the Chrome Web Store Developer Dashboard with the Google account that should permanently own the extension.
2. Register as a Chrome Web Store developer and pay Google's one-time registration fee shown in the dashboard.
3. Enable 2-Step Verification on that Google account if it is not already enabled.
4. Set and verify the developer/contact email and complete any identity/account verification Google requests.

## Create the item

1. Choose **New item** in the Developer Dashboard.
2. Upload `dist/ai-conversation-html-exporter-0.4.23.zip`.
3. Confirm that the dashboard reads version `0.4.23`, Manifest V3, the correct name, and the requested permissions.
4. If metadata inside `manifest.json` needs correction, edit it locally, increment the version, rebuild, retest, and upload the newer ZIP. Manifest metadata cannot be directly fixed in the dashboard.

## Store listing

Paste the name, summary, detailed description, category, support URL, homepage URL, and privacy-policy URL from `docs/STORE_LISTING_DRAFT.md`.

Upload:

- `store-assets/screenshot-1280x800.png`
- `store-assets/small-promo-440x280.png`

Use English as the initial language and **Productivity** as the category.

## Privacy and policy fields

- Single purpose: **Convert user-selected conversations on supported AI chat websites into portable HTML documents and print-ready PDF views.**
- Remote code: **No.** All executable JavaScript is packaged in the extension.
- Data handling: HTML creation, download, PDF, and local sharing stay on-device. The generated HTML is transmitted only when the user explicitly clicks **Publish 24h Link**, which uploads it to here.now/Cloudflare R2 after a one-time in-product confirmation.
- Disclose **website content**, conversation/user-generated content, and **web browsing activity** (local tab-URL matching). Copy the checkbox guidance in `docs/STORE_LISTING_DRAFT.md`. Do not under-disclose.
- Certify Limited Use. The public policy includes the required Limited Use statement.
- Enter the public privacy-policy URL above. Push `docs/privacy.html` before reviewers open it so the live page matches this checkout.
- Paste each permission justification from `docs/STORE_LISTING_DRAFT.md`.

## Test instructions

Suggested reviewer instructions:

> No extension account or API key is required. Open any accessible conversation on chatgpt.com, claude.ai, or gemini.google.com. Click the extension and choose Create HTML Tab. Verify that a viewer opens with the loaded conversation, then test Download HTML and PDF. Publish 24h Link is optional and transmits the generated HTML only after that explicit click. Very long conversations should be scrolled first so the source site loads all messages.

Do not provide a personal AI account or a private conversation as reviewer test data.

## Visibility and submission

1. Choose **Public** visibility.
2. Select all regions unless there is a legal/product reason to restrict distribution.
3. Confirm the item has no paid features or in-extension payments.
4. Save the draft, re-check every disclosure against the manifest and privacy policy, then submit for review.
5. Do not announce a launch date until Google approves the item. Review time varies and permission/privacy questions can cause a rejection or request for clarification.

## Updates

For every update:

1. Increment `manifest.json` and `package.json` versions.
2. Run `npm test`.
3. Run `npm run package`.
4. Inspect the ZIP contents and confirm no conversations/fixtures are included.
5. Tag/release the same version on GitHub.
6. Upload the new ZIP to the existing Web Store item and submit the update.

## Official sources

- Register: https://developer.chrome.com/docs/webstore/register/
- Prepare the extension: https://developer.chrome.com/docs/webstore/prepare/
- Publish: https://developer.chrome.com/docs/webstore/publish/
- Privacy fields: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/
- Image requirements: https://developer.chrome.com/docs/webstore/images/
- Program policies: https://developer.chrome.com/docs/webstore/program-policies/
