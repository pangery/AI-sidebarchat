# Grafika pro Chrome Web Store

## Povinné / doporučené

| Soubor | Rozměr | Poznámka |
|--------|--------|----------|
| **Store icon** | **128×128** | `store/assets/store-icon-128.png` (nahraj v Dashboard → Graphic assets) |
| Ikona v ZIP | 128×128 | `icons/icon128.png` (součást balíčku, stejný design) |
| Screenshot 1+ | **1280×800** nebo **640×400** | Panel otevřený na běžné stránce (Wikipedia, článek) |
| Small promo tile | 440×280 | Volitelné |
| Marquee | 1400×560 | Volitelné |

## Jak udělat screenshot

1. Nainstaluj rozšíření z `dist/*.zip` nebo rozbalené složky  
2. Otevři např. https://en.wikipedia.org/wiki/Artificial_intelligence  
3. Klikni na kouli **AI** → otevři panel s Geminim nebo ChatGPT  
4. Screenshot celého okna (macOS: ⌘⇧3 nebo ⌘⇧4)  
5. Ořízni na 1280×800 (Preview, Figma, nebo https://www.screenshotmachine.com)

## Hotové soubory (vygenerované)

| Soubor | Rozměr | Kam v Dashboardu |
|--------|--------|-------------------|
| `screenshot-1-1280x800.png` | 1280×800 | **Screenshots** (povinné) |
| `promo-tile-440x280.png` | 440×280 | **Small promo tile** |
| `marquee-1400x560.png` | 1400×560 | **Marquee promo tile** |
| `store-icon-128.png` | 128×128 | **Store icon** |

Přegenerovat: `python3 scripts/generate-store-assets.py`

Tyto soubory **nenahrávej do ZIP** rozšíření — jen do Developer Dashboardu → **Store listing** → **Global assets**.
