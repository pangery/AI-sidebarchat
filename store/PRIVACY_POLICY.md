# Privacy Policy — AI Sidebar Chat

**Last updated:** May 19, 2026  
**Extension:** AI Sidebar Chat (AI-sidebarchat)  
**Contact:** https://github.com/pangery/AI-sidebarchat/issues

## Summary

AI Sidebar Chat runs locally in your browser. It does **not** operate its own servers and does **not** sell user data.

## What the extension accesses

| Data | Why | Where it goes |
|------|-----|----------------|
| **Page title, URL, visible text excerpt** | To build context for your AI question | Stays on your device, or is copied to clipboard / sent only to the AI service **you** choose |
| **Text you select on a page** | Optional context for questions | Same as above |
| **Settings** (chosen AI, colors, optional API keys) | Saved in browser storage | `chrome.storage.sync` on your Google account (if sync is enabled) |
| **Floating button position** | UX preference | Local/sync storage |

## Web mode (default)

- The extension embeds the official websites of AI providers (e.g. ChatGPT, Gemini) in a sidebar iframe.
- You must be logged in to those services under your own account.
- Page context is prepared on your device and copied to the clipboard so you can paste it into the chat (Ctrl+V / ⌘V).
- **We do not receive** your chats with those providers.

## API mode (optional)

- If you enable API mode and enter API keys, requests go **directly** from your browser to the provider’s API (OpenAI, Google, Anthropic, etc.).
- API keys are stored only in your browser extension storage.
- **We do not collect or store** your API keys on any server operated by the extension author.

## What we do not collect

- No analytics SDK
- No advertising trackers
- No account system for the extension itself
- No sale or rental of personal data to third parties

## Third-party services

When you use web or API mode, the **AI provider’s** privacy policy applies to your conversation (OpenAI, Google, Anthropic, Microsoft, etc.). Review their policies on their websites.

## Data retention & deletion

- Uninstall the extension to remove locally stored settings and keys.
- To clear synced storage: remove the extension from all synced Chrome profiles, or clear extension data in `chrome://extensions` → AI Sidebar Chat → Details → Clear data.

## Children

This extension is not directed at children under 13.

## Changes

We may update this policy. The “Last updated” date will change when we do.

## Contact

Questions: open an issue at https://github.com/pangery/AI-sidebarchat/issues
