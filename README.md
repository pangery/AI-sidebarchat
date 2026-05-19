# AI Sidebar Chat (AI-sidebarchat)

Rozšíření prohlížeče: postranní AI chat s automatickým kontextem stránky. Funguje v **Chrome, Edge, Opera, Brave** a **Firefox** (Manifest V3).

- **Repozitář:** https://github.com/pangery/AI-sidebarchat  
- **Zásady soukromí:** https://pangery.github.io/AI-sidebarchat/privacy-policy.html

## Podporovaní AI agenti (web režim, bez API klíče)

| Agent | Poznámka |
|--------|----------|
| **ChatGPT** | chatgpt.com |
| **Google Gemini** | gemini.google.com |
| **Perplexity** | perplexity.ai |
| **Grok** | xAI |
| **Claude** | Anthropic |
| **Microsoft Copilot** | copilot.microsoft.com |
| **DeepSeek** | chat.deepseek.com |
| **Mistral Le Chat** | chat.mistral.ai |
| **Meta AI** | meta.ai |
| **Poe** | více modelů na jednom místě |
| **HuggingChat** | open modely |
| **You.com** | vyhledávání + chat |
| **Pi** | inflection.ai |
| **Qwen Chat** | Alibaba |

V **API režimu** (volitelné) navíc: Mistral API, DeepSeek API, Ollama lokálně.

## Instalace

### Chrome / Edge / Brave / Opera

1. Stáhni nebo naklonuj složku `AI-sidebarchat`
2. Otevři `chrome://extensions` (v Operze `opera://extensions`)
3. Zapni **Vývojářský režim**
4. **Načíst rozbalené** → vyber složku rozšíření
5. Obnov rozšíření po každé aktualizaci souborů

### Firefox

1. Otevři `about:debugging#/runtime/this-firefox`
2. **Načíst dočasné doplňkové moduly** → vyber `manifest.json` ze složky
3. Pro trvalou instalaci zabal jako `.xpi` (about:addons → vývojář)

> **Safari** vyžaduje jiný typ rozšíření (Xcode) — tato verze je určená pro Chromium a Firefox.

## Použití

1. Na libovolné stránce klikni na zelenou kouli **AI**
2. V horní liště klikni na název agenta (např. „Google Gemini“) a vyber jiného
3. **⚙** → vzhled panelu nebo všechna nastavení
4. Kontext stránky se zkopíruje automaticky → v chatu **Ctrl+V** (⌘V na Macu)

## Prohlížeče

- **Chrome** 109+
- **Microsoft Edge** 109+
- **Opera** 95+ (včetně `sidebar_action`)
- **Brave**
- **Firefox** 109+ (gecko ID v manifestu)

## Publikace na Chrome Web Store

1. Přečti **`store/CHECKLIST.md`** (účet vývojáře, screenshoty, privacy URL)
2. Sestav ZIP: `./scripts/package-chrome-store.sh`
3. Nahraj `dist/ai-sidebarchat-*-chrome-store.zip` do [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Texty pro obchod: **`store/LISTING.md`** · Zásady soukromí: **`docs/privacy-policy.html`** (GitHub Pages)

## Struktura

- `content.js` — plovoucí panel na stránce
- `store/` — podklady pro Chrome Web Store
- `scripts/package-chrome-store.sh` — balíček pro nahrání
- `providers.js` — seznam AI služeb a URL
- `browser.js` — kompatibilita `chrome` / `browser` API
- `background.js` — service worker
- `options.html` — nastavení a API klíče
