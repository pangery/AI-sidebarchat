# Chrome Web Store — listing text

Copy these into the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

## Extension name

`AI Sidebar Chat`

## Short description (max 132 characters)

Use in manifest / store “summary”:

```
Side panel for ChatGPT, Gemini, Perplexity, Grok, Claude & more. Auto page context. No account required for web mode.
```

(131 characters)

## Detailed description (English)

```
AI Sidebar Chat opens your favorite AI assistants in a sidebar while you browse — similar to a built-in Atlas-style experience.

✦ Supported services (web mode, no API key):
  ChatGPT, Google Gemini, Perplexity, Grok, Claude, Microsoft Copilot, DeepSeek, Mistral, Meta AI, Poe, HuggingChat, You.com, Pi, Qwen

✦ How it works:
  1. Click the floating AI button on any page
  2. Pick your AI from the dropdown
  3. Page context is prepared automatically — paste into chat with Ctrl+V (⌘V on Mac)
  4. Optional API mode for direct answers with your own API keys

✦ Features:
  • Floating button (draggable)
  • Right-side drawer with embedded AI chat
  • Context bar shows current page title and excerpt length
  • Keyboard shortcut: Alt+Shift+A
  • Context menu: ask about selected text
  • Customizable panel width and colors in settings

✦ Privacy:
  No extension-owned servers. Web mode uses your existing logins on AI websites. API keys (if used) stay in your browser only.

✦ Browsers:
  Built for Chrome. Also works in Edge, Brave, and Opera when installed as an unpacked extension.

Not affiliated with OpenAI, Google, Anthropic, or other AI providers.
```

## Detailed description (Czech) — optional second locale

```
AI Sidebar Chat otevře oblíbené AI asistenty v postranním panelu při prohlížení webu.

✦ Služby (web režim, bez API klíče):
  ChatGPT, Gemini, Perplexity, Grok, Claude, Copilot, DeepSeek, Mistral, Meta AI, Poe, HuggingChat, You.com, Pi, Qwen

✦ Použití:
  1. Klikni na zelenou kouli AI
  2. Vyber službu v menu
  3. Kontext stránky se připraví automaticky — vlož do chatu Ctrl+V
  4. Volitelný API režim s vlastními klíči

✦ Funkce: plovoucí tlačítko, panel vpravo, zkratka Alt+Shift+A, kontext označeného textu, nastavení vzhledu.

Soukromí: žádné vlastní servery rozšíření. API klíče zůstávají v prohlížeči.

Není oficiální produkt OpenAI, Google ani Anthropic.
```

## Category

`Productivity`

## Language

Primary: English (add Czech if you support it)

## Single purpose (for dashboard questionnaire)

```
Provide a sidebar panel to interact with third-party AI chat websites and optional user-configured AI APIs while reading the current web page, including automatic preparation of page context for the user’s questions.
```

## Permission justifications (paste per field in dashboard)

### `storage`

```
Save user preferences: selected AI provider, panel appearance, optional API keys, floating button position.
```

### `tabs` / `activeTab`

```
Read the active tab’s title and URL for the context bar; open the options page when the user clicks settings.
```

### `scripting`

```
Inject the sidebar UI on web pages when the user opens the extension.
```

### `contextMenus`

```
Add “Ask AI about selection” when the user highlights text on a page.
```

### `declarativeNetRequest` + `declarativeNetRequestWithHostAccess`

```
Allow embedding official AI chat websites in the sidebar iframe by adjusting response headers only for those AI provider domains (required for in-panel web mode).
```

### Host permission `<all_urls>`

```
Run the content script on pages the user visits so the floating button and sidebar appear; read a text excerpt from the current page to build question context. Data is processed locally and is not sent to extension-owned servers.
```

### Host permissions (AI / API domains)

```
Load embedded AI chats in web mode and send API requests in optional API mode only to the provider the user selects.
```

## Notes for reviewers

```
1. Install the extension and open any normal website (e.g. wikipedia.org).
2. Click the green “AI” floating button at bottom-right.
3. Use the dropdown in the header to switch between Gemini, ChatGPT, etc.
4. Click the gear icon to open extension options.
5. Web mode: context is copied to clipboard; paste with Ctrl+V in the embedded chat.
6. API mode (optional): enable in options and add a user-provided API key.

The extension does not include remote code. All logic is in the submitted package.
```
