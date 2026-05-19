# Checklist — publikace na Chrome Web Store

## 1. Účet vývojáře (jednorázově)

1. Přihlas se Google účtem: https://chrome.google.com/webstore/devconsole  
2. Zaplať **jednorázový poplatek cca 5 USD** (Developer registration)  
3. Vyplň jméno / kontakt vývojáře

## 2. Před nahráním — uprav u sebe

- [ ] V `store/PRIVACY_POLICY.md` a `docs/privacy-policy.html` nastav **svůj e-mail**  
- [ ] Nahraj `docs/privacy-policy.html` na veřejnou URL (GitHub Pages viz níže)  
- [ ] Pořiď **screenshoty** panelu (min. 1× 1280×800 nebo 640×400) — viz `store/assets/README.md`  
- [ ] (Doporučeno) Lepší ikona 128×128 — aktuální je placeholder

## 3. Sestavení ZIP balíčku

```bash
cd /Users/jangergel/AI-sidebarchat
./scripts/package-chrome-store.sh
```

Výstup: `dist/ai-sidebarchat-3.6.0-chrome-store.zip`

## 4. GitHub Pages — URL pro zásady ochrany soukromí

1. Repozitář na GitHubu `AI-sidebarchat`  
2. **Settings → Pages → Source:** Deploy from branch `main`, folder `/docs`  
3. Privacy policy URL (po pushi a zapnutí Pages):  
   **https://pangery.github.io/AI-sidebarchat/privacy-policy.html**  
4. Tuto URL vlož do pole **Privacy policy** v Developer Dashboard

## 5. Nová položka v Dashboardu

| Pole | Hodnota |
|------|---------|
| ZIP | `dist/ai-sidebarchat-*-chrome-store.zip` |
| Privacy policy | URL z GitHub Pages |
| Category | Productivity |
| Language | English (+ Czech volitelně) |
| Texty | zkopíruj z `store/LISTING.md` |
| Oprávnění | odůvodnění z `store/LISTING.md` |
| Notes for reviewers | sekce v `store/LISTING.md` |

## 6. Prohlášení o datech (Data use)

V dashboardu zaškrtni přesně podle chování:

- **Website content** — ano (excerpt stránky pro kontext, lokálně)  
- **User activity** — ne (žádné vlastní analytics)  
- **Personally identifiable information** — ne (rozšíření nesbírá)  
- **Health / financial** — ne  

Certifikace: data **neprodáváš**, nepoužíváš k účelům nesouvisejícím s funkcí rozšíření.

## 7. Rizika při review (buď připravený)

- **`&lt;all_urls&gt;`** — Google může ptát na zdůvodnění; text je v `LISTING.md`  
- **Úprava hlaviček (DNR)** pro iframe AI stránek — může trvat déle nebo vyžádat vysvětlení; není to obcházení paywallů, jen embed oficiálních chatů  
- Rozšíření **není** oficiální produkt OpenAI/Google — v popisu je disclaimer

## 8. Po schválení

- Edge: stejný balíček lze nahrát do [Microsoft Partner Center](https://partner.microsoft.com/dashboard) (Edge Add-ons)  
- Opera Add-ons: https://addons.opera.com/developer/  
- Firefox: samostatný proces na addons.mozilla.org (jiný manifest / XPI)

## 9. Aktualizace verze

1. Zvyš `"version"` v `manifest.json`  
2. Spusť znovu `./scripts/package-chrome-store.sh`  
3. V Dashboardu **Upload new package**
