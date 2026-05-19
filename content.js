const api = globalThis.browser ?? globalThis.chrome;

const SELECTION_BTN_ID = "ai-atlas-ask-btn";
const FAB_ID = "ai-atlas-fab";
const DRAWER_ID = "ai-atlas-drawer";
const DRAWER_VERSION = "3.6.0";
const FAB_SIZE = 56;

let hideTimer;
let fabDragging = false;
let fabMoved = false;
let fabStartX = 0;
let fabStartY = 0;
let fabStartLeft = 0;
let fabStartTop = 0;
let drawerOpen = false;
let currentProvider = "gemini";
let chatHistory = [];
let lastClickText = "";
let lastAutoUrl = "";
let contextRefreshTimer = null;
let urlWatchTimer = null;
let isAnalyzing = false;
let useWebMode = true;
let pageSettings = { includePageContext: true, includeClickContext: true, autoAnalyzeOnOpen: false };

const AUTO_ANALYZE_PROMPT =
  "Uživatel právě prohlíží tuto stránku. Automaticky popiš: o čem stránka je, co tu může dělat a na co si dát pozor. Odpověz stručně česky.";

function isBlockedHost() {
  return (
    location.protocol === "chrome-extension:" ||
    location.hostname === "chatgpt.com" ||
    location.hostname === "gemini.google.com" ||
    location.hostname.endsWith("perplexity.ai")
  );
}

function getHost() {
  return document.body || document.documentElement;
}

function loadSettings() {
  return new Promise((resolve) => {
    api.storage.sync.get(
      {
        aiProvider: "gemini",
        apiProvider: "gemini",
        useWebMode: true,
        includePageContext: true,
        includeClickContext: true,
        autoAnalyzeOnOpen: false,
        useApiMode: false
      },
      (data) => {
        const saved = data.aiProvider || data.apiProvider || "gemini";
        const normalized = saved === "openai" ? "chatgpt" : saved;
        currentProvider = WEB_PROVIDER_IDS.includes(normalized)
          ? normalized
          : API_PROVIDER_IDS.includes(normalized)
            ? normalized
            : "gemini";
        useWebMode = data.useWebMode !== false && data.useApiMode !== true;
        pageSettings.includePageContext = data.includePageContext !== false;
        pageSettings.includeClickContext = data.includeClickContext !== false;
        pageSettings.autoAnalyzeOnOpen = data.autoAnalyzeOnOpen === true;
        resolve(data);
      }
    );
  });
}

function getPageExcerpt() {
  const selectors = ["article", "main", '[role="main"]', "#content", ".content", ".post"];
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    const text = cleanText(el?.innerText);
    if (text.length > 200) return text.slice(0, 4500);
  }
  return cleanText(document.body?.innerText || "").slice(0, 4500);
}

function capturePageContext() {
  return {
    title: document.title || "",
    url: location.href,
    excerpt: pageSettings.includePageContext ? getPageExcerpt() : "",
    selection: window.getSelection()?.toString()?.trim() || "",
    lastClick: pageSettings.includeClickContext ? lastClickText : ""
  };
}

function updateContextBar() {
  const drawer = getDrawer();
  if (!drawer) return;
  const label = drawer.querySelector(".ai-atlas-context-label");
  const meta = drawer.querySelector(".ai-atlas-context-meta");
  if (!label) return;

  const ctx = capturePageContext();
  label.textContent = ctx.title || ctx.url || "Aktuální stránka";
  label.title = ctx.url;
  const mode = useWebMode ? "Web · bez API klíče" : "API";
  meta.textContent = `${mode} · ${ctx.excerpt.length} znaků · ${getProviderLabel(currentProvider)}`;
}

document.addEventListener(
  "click",
  (event) => {
    const el = event.target.closest("a, button, h1, h2, h3, h4, p, li, td, label, [role='button']");
    if (!el) return;
    const text = cleanText(el.innerText || el.getAttribute("aria-label") || "");
    if (text.length > 2) lastClickText = text.slice(0, 180);
  },
  true
);

function getDrawer() {
  return document.getElementById(DRAWER_ID);
}

async function resolveProvider(strict = false) {
  const res = await api.runtime.sendMessage({
    type: "RESOLVE_PROVIDER",
    preferred: currentProvider,
    strict
  });
  if (res?.provider && !strict) {
    currentProvider = res.provider;
    syncProviderPickerUI();
  }
  return res?.provider || null;
}

function normalizeStoredProvider(id) {
  const saved = id === "openai" ? "chatgpt" : id;
  if (useWebMode) {
    return WEB_PROVIDER_IDS.includes(saved) ? saved : "gemini";
  }
  return API_PROVIDER_IDS.includes(saved) ? saved : "gemini";
}

function syncProviderPickerUI() {
  const drawer = getDrawer();
  if (!drawer) return;
  const label = drawer.querySelector(".ai-atlas-provider-trigger-label");
  if (label) label.textContent = getProviderLabel(currentProvider);
  drawer.querySelectorAll(".ai-atlas-provider-option").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.id === currentProvider);
  });
}

function setProvider(id) {
  currentProvider = normalizeStoredProvider(id);
  api.storage.sync.set({ aiProvider: currentProvider, apiProvider: currentProvider });
  syncProviderPickerUI();
  updateContextBar();
  closeProviderMenu();
  if (useWebMode) {
    loadWebFrame();
    copyPageContextForChat({ template: "activity" });
  } else {
    chatHistory = [];
    runAutoAnalyze(true);
  }
}

function closeProviderMenu() {
  const menu = getDrawer()?.querySelector(".ai-atlas-provider-menu");
  const trigger = getDrawer()?.querySelector(".ai-atlas-provider-trigger");
  menu?.classList.add("hidden");
  trigger?.setAttribute("aria-expanded", "false");
}

function rebuildProviderMenu() {
  const drawer = getDrawer();
  const menu = drawer?.querySelector(".ai-atlas-provider-menu");
  if (!menu) return;
  menu.innerHTML = "";
  const ids = useWebMode ? WEB_PROVIDER_ORDER : API_PROVIDER_IDS;
  for (const id of ids) {
    if (useWebMode && !(id in WEB_PROVIDERS)) continue;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ai-atlas-provider-option";
    btn.dataset.id = id;
    btn.setAttribute("role", "option");
    btn.textContent = getProviderLabel(id);
    if (id === currentProvider) btn.classList.add("is-active");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setProvider(id);
    });
    menu.appendChild(btn);
  }
  syncProviderPickerUI();
}

function setupProviderPicker(drawer) {
  const trigger = drawer.querySelector(".ai-atlas-provider-trigger");
  const menu = drawer.querySelector(".ai-atlas-provider-menu");
  if (!trigger || !menu) return;

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const open = menu.classList.contains("hidden");
    if (open) {
      rebuildProviderMenu();
      menu.classList.remove("hidden");
      trigger.setAttribute("aria-expanded", "true");
    } else {
      closeProviderMenu();
    }
  });

  drawer.addEventListener("click", (e) => {
    if (!e.target.closest(".ai-atlas-provider-picker")) closeProviderMenu();
  });
}

function openExtensionSettings() {
  try {
    const maybePromise = api.runtime.openOptionsPage?.();
    if (maybePromise && typeof maybePromise.catch === "function") {
      maybePromise.catch(() => api.runtime.sendMessage({ type: "OPEN_OPTIONS" }));
    }
  } catch {
    api.runtime.sendMessage({ type: "OPEN_OPTIONS" });
  }
}

function resizeWebFrame() {
  const wrap = getDrawer()?.querySelector(".ai-atlas-web-wrap");
  const frame = wrap?.querySelector(".ai-atlas-web-frame");
  if (!wrap || !frame) return;
  const h = wrap.getBoundingClientRect().height;
  if (h > 0) frame.style.height = `${Math.floor(h)}px`;
}

function loadWebFrame() {
  const frame = getDrawer()?.querySelector(".ai-atlas-web-frame");
  if (!frame) return;
  frame.src = getWebUrl(currentProvider);
  requestAnimationFrame(() => {
    resizeWebFrame();
    requestAnimationFrame(resizeWebFrame);
  });
}

function setStatusBanner(text, type = "ok") {
  const el = getDrawer()?.querySelector(".ai-atlas-status-banner");
  if (!el) return;
  el.className = `ai-atlas-status-banner ai-atlas-status-banner--${type}`;
  el.textContent = text;
  el.hidden = false;
}

async function copyPageContextForChat({ template, customText } = {}) {
  const ctx = capturePageContext();
  const prompt = buildPagePrompt({
    ...ctx,
    template: template || "activity",
    customText
  });
  try {
    await navigator.clipboard.writeText(prompt);
    setStatusBanner("✓ Kontext stránky zkopírován — vlož do chatu níže (Ctrl+V)", "ok");
    return true;
  } catch {
    setStatusBanner("Zkopíruj dotaz ručně z pole výše", "warn");
    const input = getDrawer()?.querySelector(".ai-atlas-ask-input");
    if (input) input.value = prompt;
    return false;
  }
}

function showWebUI() {
  const d = getDrawer();
  if (!d) return;
  d.querySelector(".ai-atlas-web-wrap")?.classList.remove("hidden");
  d.querySelector(".ai-atlas-api-panel")?.classList.add("hidden");
}

function showApiUI() {
  const d = getDrawer();
  if (!d) return;
  d.querySelector(".ai-atlas-web-wrap")?.classList.add("hidden");
  d.querySelector(".ai-atlas-api-panel")?.classList.remove("hidden");
}

async function ensureDrawer() {
  let drawer = getDrawer();
  if (drawer?.dataset.version === DRAWER_VERSION) return drawer;
  if (drawer) drawer.remove();

  await loadSettings();
  currentProvider = normalizeStoredProvider(currentProvider);

  drawer = document.createElement("div");
  drawer.id = DRAWER_ID;
  drawer.dataset.version = DRAWER_VERSION;
  drawer.innerHTML = `
    <div class="ai-atlas-drawer-backdrop" data-close></div>
    <aside class="ai-atlas-drawer-panel">
      <div class="ai-atlas-drawer-chrome">
        <header class="ai-atlas-drawer-header">
          <span class="ai-atlas-drawer-title">AI Sidebar Chat</span>
          <div class="ai-atlas-provider-picker">
            <button type="button" class="ai-atlas-provider-trigger" aria-haspopup="listbox" aria-expanded="false">
              <span class="ai-atlas-provider-trigger-label">Gemini</span>
              <span class="ai-atlas-provider-chevron" aria-hidden="true">▾</span>
            </button>
            <div class="ai-atlas-provider-menu hidden" role="listbox"></div>
          </div>
          <button type="button" class="ai-atlas-settings-btn" title="Nastavení rozšíření" aria-label="Nastavení">⚙</button>
        <button type="button" class="ai-atlas-drawer-close" title="Zavřít">×</button>
      </header>
      <div class="ai-atlas-context-bar">
          <span class="ai-atlas-context-pulse" aria-hidden="true"></span>
        <div class="ai-atlas-context-text">
          <div class="ai-atlas-context-label">…</div>
          <div class="ai-atlas-context-meta"></div>
        </div>
          <button type="button" class="ai-atlas-context-refresh" title="Zkopírovat kontext stránky">↻</button>
        </div>
        <div class="ai-atlas-status-banner" hidden></div>
      </div>
      <div class="ai-atlas-chat-body">
        <div class="ai-atlas-web-wrap">
          <iframe class="ai-atlas-web-frame" title="AI chat"></iframe>
        </div>
        <div class="ai-atlas-api-panel hidden">
          <div class="ai-atlas-messages"></div>
        </div>
      </div>
    </aside>
  `;

  setupProviderPicker(drawer);
  rebuildProviderMenu();

  drawer.querySelector(".ai-atlas-settings-btn").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openExtensionSettings();
  });
  drawer.querySelector(".ai-atlas-drawer-close").addEventListener("click", closeDrawer);
  drawer.querySelector("[data-close]").addEventListener("click", closeDrawer);
  drawer.querySelector(".ai-atlas-context-refresh").addEventListener("click", async (e) => {
    e.stopPropagation();
    if (useWebMode) {
      await copyPageContextForChat({ template: "activity" });
    } else {
      chatHistory = [];
      runAutoAnalyze(true);
    }
  });

  getHost().appendChild(drawer);
  updateContextBar();
  return drawer;
}

function appendMessage(role, text) {
  const box = getDrawer()?.querySelector(".ai-atlas-messages");
  if (!box) return;
  const row = document.createElement("div");
  row.className = `ai-atlas-msg-row ai-atlas-msg-row--${role}`;
  const bubble = document.createElement("div");
  bubble.className = `ai-atlas-bubble ai-atlas-bubble--${role}`;
  bubble.textContent = text;
  row.appendChild(bubble);
  box.appendChild(row);
  requestAnimationFrame(() => row.classList.add("is-in"));
  box.scrollTop = box.scrollHeight;
  return;
}

function appendMessageLegacy(role, text) {
  const box = getDrawer()?.querySelector(".ai-atlas-messages");
  if (!box) return;
  const el = document.createElement("div");
  el.className = `ai-atlas-msg ai-atlas-msg-${role}`;
  el.textContent = text;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function setLoading(on, text = "Automaticky čtu stránku a připravuji odpověď…") {
  const drawer = getDrawer();
  drawer?.querySelector(".ai-atlas-ask-send")?.toggleAttribute("disabled", on);
  drawer?.querySelector(".ai-atlas-ask-input")?.toggleAttribute("disabled", on);
  drawer?.querySelector(".ai-atlas-context-refresh")?.toggleAttribute("disabled", on);
  if (on) appendMessage("loading", text);
  else drawer?.querySelector(".ai-atlas-msg-loading")?.remove();
}

async function sendApiChat(userText, { template, showUser = true, resetHistory = false } = {}) {
  let text = userText;
  if (template) text = templateToUserMessage(template) || userText;
  if (!text?.trim()) return;

  const provider = await resolveProvider(true);
  if (!provider) {
    const name = getProviderLabel(currentProvider);
    appendMessage(
      "error",
      `API režim: chybí klíč pro „${name}“. V Možnostech zapni „Web režim“ (bez klíče) nebo doplň API klíč.`
    );
    return;
  }
  if (resetHistory) chatHistory = [];
  if (showUser) appendMessage("user", text);

  setLoading(true);
  const pageContext = capturePageContext();

  try {
    const response = await api.runtime.sendMessage({
      type: "API_CHAT",
      provider: currentProvider,
      userMessage: text,
      pageContext,
      history: chatHistory
    });
    if (response?.error) throw new Error(response.error);
    appendMessage("assistant", response.reply);
    chatHistory.push({ role: "user", content: text });
    chatHistory.push({ role: "assistant", content: response.reply });
    lastAutoUrl = pageContext.url;
  } catch (error) {
    appendMessage("error", error.message || String(error));
  }

  setLoading(false);
  isAnalyzing = false;
}

async function runAutoAnalyze(force = false) {
  if (isAnalyzing) return;
  const ctx = capturePageContext();
  if (!force && ctx.url === lastAutoUrl && chatHistory.length > 0) return;

  isAnalyzing = true;
  const box = getDrawer()?.querySelector(".ai-atlas-messages");
  if (box && force) box.innerHTML = "";

  await sendApiChat(AUTO_ANALYZE_PROMPT, { showUser: false, resetHistory: force });
}

function showDrawerToast(msg) {
  const t = getDrawer()?.querySelector(".ai-atlas-toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}

function startUrlWatch() {
  stopUrlWatch();
  let prev = location.href;
  urlWatchTimer = setInterval(() => {
    if (!drawerOpen || location.href === prev) return;
    prev = location.href;
    updateContextBar();
    chatHistory = [];
    if (useWebMode) {
      copyPageContextForChat({ template: "activity" });
    } else {
      runAutoAnalyze(true);
    }
  }, 1200);
}

function stopUrlWatch() {
  if (urlWatchTimer) clearInterval(urlWatchTimer);
  urlWatchTimer = null;
}

function startContextRefresh() {
  stopContextRefresh();
  updateContextBar();
  contextRefreshTimer = setInterval(updateContextBar, 5000);
}

function stopContextRefresh() {
  if (contextRefreshTimer) clearInterval(contextRefreshTimer);
  contextRefreshTimer = null;
}

async function openDrawer() {
  if (isBlockedHost()) {
    api.runtime.sendMessage({ type: "OPEN_PANEL" });
    return;
  }

  await loadSettings();
  const drawer = await ensureDrawer();
  drawer.classList.remove("is-open");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => drawer.classList.add("is-open"));
  });
  document.documentElement.classList.add("ai-atlas-drawer-active");
  drawerOpen = true;
  startContextRefresh();
  startUrlWatch();
  document.getElementById(FAB_ID)?.classList.add("is-hidden");

  if (useWebMode) {
    showWebUI();
    loadWebFrame();
    resizeWebFrame();
    await copyPageContextForChat({ template: "activity" });
  } else {
    showApiUI();
    const provider = await resolveProvider(true);
    if (provider && pageSettings.autoAnalyzeOnOpen) {
      await runAutoAnalyze(false);
    } else if (!provider) {
      appendMessage(
        "error",
        "Zapni Web režim v Možnostech (bez API klíče) nebo doplň API klíč."
      );
    }
  }
}

function closeDrawer() {
  getDrawer()?.classList.remove("is-open");
  document.documentElement.classList.remove("ai-atlas-drawer-active");
  drawerOpen = false;
  stopContextRefresh();
  stopUrlWatch();
  document.getElementById(FAB_ID)?.classList.remove("is-hidden");
}

async function toggleDrawer() {
  drawerOpen ? closeDrawer() : openDrawer();
}

function removeFab() {
  document.getElementById(FAB_ID)?.remove();
}

function clampFabPosition(left, top) {
  return {
    left: Math.max(8, Math.min(window.innerWidth - FAB_SIZE - 8, left)),
    top: Math.max(8, Math.min(window.innerHeight - FAB_SIZE - 8, top))
  };
}

function applyFabPosition(fab, x, y) {
  fab.style.right = fab.style.bottom = "auto";
  fab.style.left = `${x}px`;
  fab.style.top = `${y}px`;
}

function createFab(settings) {
  if (isBlockedHost() || document.getElementById(FAB_ID)) return;
  const fab = document.createElement("button");
  fab.id = FAB_ID;
  fab.type = "button";
  fab.title = "AI — automatická analýza stránky";
  fab.innerHTML = "<span>AI</span>";
  if (settings.fabX != null) {
    const p = clampFabPosition(settings.fabX, settings.fabY);
    applyFabPosition(fab, p.left, p.top);
  }
  fab.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    fabDragging = true;
    fabMoved = false;
    const r = fab.getBoundingClientRect();
    fabStartX = e.clientX;
    fabStartY = e.clientY;
    fabStartLeft = r.left;
    fabStartTop = r.top;
    applyFabPosition(fab, fabStartLeft, fabStartTop);
    e.preventDefault();
  });
  fab.addEventListener("click", () => {
    if (!fabMoved) toggleDrawer();
  });
  getHost().appendChild(fab);
}

function initFab() {
  api.storage.sync.get({ showFloatingBall: true, fabX: null, fabY: null }, (s) => {
    s.showFloatingBall === false ? removeFab() : createFab(s);
  });
}

document.addEventListener("mousemove", (e) => {
  if (!fabDragging) return;
  const fab = document.getElementById(FAB_ID);
  if (!fab) return;
  if (Math.abs(e.clientX - fabStartX) > 4 || Math.abs(e.clientY - fabStartY) > 4) fabMoved = true;
  const p = clampFabPosition(fabStartLeft + e.clientX - fabStartX, fabStartTop + e.clientY - fabStartY);
  applyFabPosition(fab, p.left, p.top);
});

document.addEventListener("mouseup", () => {
  if (!fabDragging) return;
  fabDragging = false;
  const fab = document.getElementById(FAB_ID);
  if (fab && fabMoved) {
    api.storage.sync.set({ fabX: parseInt(fab.style.left, 10), fabY: parseInt(fab.style.top, 10) });
  }
});

function removeSelectionButton() {
  document.getElementById(SELECTION_BTN_ID)?.remove();
}

function showSelectionButton(rect, text) {
  if (isBlockedHost() || !text?.trim()) {
    removeSelectionButton();
    return;
  }
  let btn = document.getElementById(SELECTION_BTN_ID);
  if (!btn) {
    btn = document.createElement("button");
    btn.id = SELECTION_BTN_ID;
    btn.textContent = "Zeptat se AI";
    btn.addEventListener("click", async () => {
      const sel = window.getSelection()?.toString()?.trim() || text;
      if (!drawerOpen) await openDrawer();
      await sendApiChat(`Vysvětli tento označený text: "${sel}"`);
      removeSelectionButton();
    });
    getHost().appendChild(btn);
  }
  btn.style.top = `${Math.min(window.innerHeight - 48, rect.bottom + 8) + window.scrollY}px`;
  btn.style.left = `${Math.min(window.innerWidth - 160, rect.left) + window.scrollX}px`;
}

api.runtime.onMessage.addListener((message) => {
  if (message.type === "OPEN_DRAWER") openDrawer();
  if (message.type === "RUN_API_PROMPT") {
    openDrawer().then(async () => {
      await loadSettings();
      if (message.selection) {
        await sendApiChat(`Vysvětli: "${message.selection}"`);
      } else if (message.template) {
        await sendApiChat("", { template: message.template });
      } else if (message.customText) {
        await sendApiChat(message.customText);
      }
    });
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawerOpen) closeDrawer();
});

api.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    if (changes.showFloatingBall) {
      changes.showFloatingBall.newValue === false ? removeFab() : initFab();
    }
    if (
      changes.includePageContext ||
      changes.includeClickContext ||
      changes.apiProvider ||
      changes.aiProvider ||
      changes.useWebMode ||
      changes.useApiMode
    ) {
      loadSettings().then(() => {
        currentProvider = normalizeStoredProvider(currentProvider);
        rebuildProviderMenu();
        updateContextBar();
        if (drawerOpen) {
          if (useWebMode) {
            showWebUI();
            loadWebFrame();
          } else {
            showApiUI();
          }
        }
      });
    }
  }
});

document.addEventListener("mouseup", () => {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    const sel = window.getSelection();
    const text = sel?.toString()?.trim();
    if (!text || sel.isCollapsed) {
      removeSelectionButton();
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (rect.width || rect.height) showSelectionButton(rect, text);
  }, 120);
});

function boot() {
  if (!isBlockedHost()) initFab();
  window.addEventListener("resize", () => {
    if (drawerOpen) resizeWebFrame();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
