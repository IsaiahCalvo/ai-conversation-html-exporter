# Chrome Web Store release guide (Manifest V3)

**Project:** AI Conversation HTML Exporter `0.4.21`
**Checked:** 2026-07-25
**Scope:** Current first-party Chrome/Google documentation only. This is a preparation checklist; nothing was uploaded or submitted.

## 1. Developer account and verification

- Sign in to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), accept the developer agreement/policies, register as a CWS developer, and pay the **one-time registration fee**. Google's public registration guide does not state a fixed amount; use the amount and currency shown by the Dashboard at registration. Choose the publishing Google Account carefully: its email cannot later be changed, although items can be transferred. ([Register your developer account](https://developer.chrome.com/docs/webstore/register/))
- On **Account**, provide a publisher name and verify the contact email using the emailed verification link. A physical address is required when an item offers purchases, paid features, or subscriptions. ([Set up your developer account](https://developer.chrome.com/docs/webstore/set-up-account/))
- Enable Google Account **2-Step Verification before publishing or updating**; it is mandatory for every CWS developer account. ([2-Step Verification policy](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification/))
- Accurately self-declare **trader/non-trader** status if the Dashboard requests it; users may be shown the resulting consumer-rights disclosure. ([Trader/non-trader identification](https://developer.chrome.com/docs/webstore/program-policies/trader-disclosure/))

## 2. Package and Manifest V3 rules

- New Web Store items must use **Manifest V3**. ([Best practices — Manifest Version 3](https://developer.chrome.com/docs/webstore/best-practices#manifest-version-3))
- Build one ZIP containing all runtime extension files, with `manifest.json` at the **ZIP root**, not inside a parent directory. Validate the unpacked build locally first. Manifest metadata cannot be edited in the Dashboard; correcting it requires a higher version and a rebuilt ZIP. ([Prepare your extension](https://developer.chrome.com/docs/webstore/prepare/))
- Keep executable logic self-contained in the package. Do not load remote scripts, execute fetched strings with `eval()`-like mechanisms, or create an interpreter for remote commands. Remote data, images, account sync, feature flags whose logic is local, and server-side operations are allowed subject to privacy rules. The documented remote-execution exemptions are narrowly limited to the Debugger API, User Scripts API, and code isolated from extension APIs such as sandboxed pages/iframes. ([Additional MV3 requirements](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements/))
- Code must be reviewable: obfuscation is prohibited; minification is allowed but can slow review. Prefer understandable authored output and omit tests, credentials, development dependencies, and unrelated files from the release ZIP. ([Review process — code formatting](https://developer.chrome.com/docs/webstore/review-process/#review-time-factors))

## 3. Store listing assets

Required assets:

| Asset | Requirement |
|---|---|
| Store/extension icon | **128×128 PNG** in the extension ZIP; for a square design, Google recommends 96×96 artwork plus 16 px transparent padding on each side |
| Screenshots | **1–5**, each **1280×800 or 640×400**, full bleed with square corners; show the real core experience |
| Small promotional tile | **440×280 PNG or JPEG** |

Optional assets: a **1400×560 PNG/JPEG marquee tile** (needed for marquee featuring eligibility) and a YouTube promotional video. Localized descriptions/screenshots/videos may be supplied for locales declared by the extension; promo tiles are not localized. ([Supplying Images](https://developer.chrome.com/docs/webstore/images/); [Complete your listing information](https://developer.chrome.com/docs/webstore/cws-dashboard-listing/))

Also provide a precise detailed description, primary category, language, and—where available—homepage, support, and verified official URL. Listing text and images must accurately represent the shipped behavior and avoid keyword spam. ([Complete your listing information](https://developer.chrome.com/docs/webstore/cws-dashboard-listing/))

## 4. Privacy, user data, and permissions

- In **Privacy practices**, state one narrow, easy-to-understand single purpose, justify every declared permission, disclose any remote-code use, select every collected/handled data type, certify Limited Use compliance, and provide the privacy-policy URL. Dashboard answers, policy, listing, UI, and actual behavior must agree. ([Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/))
- “Handling” includes collecting, transmitting, using, sharing, scraping website content, and processing or storing data **locally**. An extension that handles user data must publish a privacy policy describing what it collects, how it uses it, and when it shares it; transmissions of user data must use secure transport. ([User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq/))
- If data collection/use would not be obvious from the feature, give an in-product prominent disclosure and obtain affirmative consent **before** handling it; a store listing or privacy policy alone is insufficient. Web-browsing activity may be collected/transmitted only as required for a prominently described user-facing feature, not for advertising or unrelated monetization. ([User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq/))
- Request only the narrowest required permissions for functionality that exists now—not speculative future features. This applies to required and optional permissions. Broad host permissions and sensitive execution permissions receive closer review and can lengthen review. ([Use of Permissions](https://developer.chrome.com/docs/webstore/program-policies/permissions/); [Review process](https://developer.chrome.com/docs/webstore/review-process/#review-time-factors))
- Keep one purpose: unrelated functionality belongs in a separate extension. Persistent UI must complement the user's browsing task rather than hijack it. ([Quality guidelines](https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines/))

### Project-specific preflight

The release candidate is MV3/version `0.4.21`. Its permission usage was checked against the source:

1. `activeTab` and the supported-site host permissions scope extraction to user-invoked ChatGPT, Claude, and Gemini conversations. `scripting` is used only as a fallback to inject the packaged content script when it is not already responding.
2. `tabs` is used to create, find, focus, and reuse viewer/source tabs. `storage` stores lightweight session indexes, while `unlimitedStorage` supports the IndexedDB payloads used for very large local HTML exports. `downloads` saves the generated standalone HTML.
3. here.now and Cloudflare R2 host access is used only after the user explicitly chooses **Publish 24h Link**. The privacy policy and Dashboard disclosures must explain that this action transmits the generated conversation HTML; ordinary HTML/PDF creation remains local.
4. The sanitized Store ZIP is built from a runtime-file allowlist. It contains the required 128×128 icon and manifest icon declarations and excludes test conversations, credentials, development files, and unrelated assets.
5. Required listing artwork is ready: a 1280×800 synthetic screenshot and 440×280 promotional tile. No private conversation appears in either asset.

The optional publishing hosts are broader than the three conversation-site hosts because here.now returns a presigned Cloudflare R2 upload URL at runtime. This is defensible for the shipped publish feature, but it may receive additional review; the reviewer justification should describe that exact request flow.

## 5. Testing and reviewer access

- Load the unpacked production build at `chrome://extensions`, exercise every feature, and check for service-worker/content-script errors. Chrome recommends end-to-end tests plus manual testing across browser versions, operating systems, and network conditions. ([Prepare your extension](https://developer.chrome.com/docs/webstore/prepare/); [Best practices — performance](https://developer.chrome.com/docs/webstore/best-practices#performance))
- Test export on supported ChatGPT, Claude, and Gemini pages; verify generated HTML offline; test empty, long, code-heavy, image-containing, and changed-site-DOM conversations; verify download naming; and test both decline and success/failure paths for optional here.now publishing.
- If reviewers need special steps, an account, or credentials, enter complete reproducible instructions in the Dashboard's **Test instructions** tab. Never place secrets in the ZIP. ([Publish in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish/))
- For pre-launch installs, use **Private** visibility with trusted tester Google Accounts/owned Google Groups, or publish a separate BETA/TESTING item with Google's required testing labels. ([Set up distribution](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution/))

## 6. Submission, review, visibility, and release

1. Dashboard → **Add new item** → upload the ZIP. Complete **Store listing**, **Privacy practices**, **Distribution**, and **Test instructions** (if needed), then choose **Submit for Review**. Do not submit until all warnings and disclosures are resolved. ([Publish](https://developer.chrome.com/docs/webstore/publish/))
2. Choose visibility: **Public** (listed/searchable), **Unlisted** (installable by anyone with its CWS URL), or **Private** (restricted testers/groups/domain). Select all regions or specific countries. ([Distribution](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution/))
3. Choose automatic publication after approval or **deferred publishing**. Deferred approval lets the developer release manually; a staged submission expires after **30 days** and returns to draft. ([Publish](https://developer.chrome.com/docs/webstore/publish/); [Update](https://developer.chrome.com/docs/webstore/update/))
4. Review combines automated and manual systems. Most extensions finish within a few days, but review can take weeks. New developers/items, dangerous or broad host permissions, large/hard-to-review code, significant changes, and prior rejections can increase review time. Approval permits publication; a policy violation causes rejection and an explanation, with appeals available in the Dashboard. Published items may also be periodically re-reviewed. ([Review process](https://developer.chrome.com/docs/webstore/review-process/))

## 7. Updates after first release

- For any package/code/manifest change, increment `manifest.version`, create a complete new ZIP containing changed and unchanged runtime files, upload it under **Package → Upload New Package**, update listing/privacy/distribution metadata as needed, and submit the update for the same review process. Existing users remain on the currently published version until the update is published. ([Update your item](https://developer.chrome.com/docs/webstore/update/))
- Moving testing → production means changing visibility and republishing. Moving a published item back to Private requires unpublishing first; returning it to Public requires a new version and review. Use a separate Web Store item to run beta and production in parallel. ([Update your item](https://developer.chrome.com/docs/webstore/update/))
- Optional hardening: opt into **Verified CRX Uploads** so future package updates must be signed with the registered RSA key. Preserve the private key securely; this is an additional account-compromise defense. ([Update — protect package updates](https://developer.chrome.com/docs/webstore/update/#protect-package-updates))

## 2026 readiness summary

The current first-party publication docs identify no separate “2026 manifest” or new annual submission format. The requirements that matter now are: MV3 for new items, mandatory 2-Step Verification, verified contact email, accurate trader/non-trader declaration where requested, self-contained/reviewable MV3 logic, minimum permissions, complete privacy/Limited Use disclosures, a user-data privacy policy, required listing artwork, and review for every new package/update. Re-check the live Dashboard and the [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/) immediately before submission because review and enforcement practices can change without notice.
