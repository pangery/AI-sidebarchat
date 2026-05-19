importScripts("browser.js", "providers.js", "api.js");

const api = globalThis.ext ?? globalThis.browser ?? globalThis.chrome;

const MENU_ASK = "ai-atlas-ask-selection";
const MENU_SUMMARIZE = "ai-atlas-summarize";

api.runtime.onInstalled.addListener(() => {
  api.storage.sync.get({ useWebMode: true, useApiMode: false }, (data) => {
    if (data.useApiMode === true) return;
    api.storage.sync.set({
      useWebMode: true,
      useApiMode: false,
      autoAnalyzeOnOpen: false
    });
  });

  api.contextMenus.removeAll(() => {
    api.contextMenus.create({
      id: MENU_ASK,
      title: "Zeptat se AI na výběr",
      contexts: ["selection"]
    });
    api.contextMenus.create({
      id: MENU_SUMMARIZE,
      title: "Shrň stránku v AI panelu",
      contexts: ["page"]
    });
  });
});

async function getActiveTab() {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function injectAndOpenDrawer(tabId) {
  await api.scripting.executeScript({
    target: { tabId },
    files: ["browser.js", "providers.js", "content.js"]
  });
  await api.tabs.sendMessage(tabId, { type: "OPEN_DRAWER" });
}

async function openPanel() {
  const tab = await getActiveTab();

  if (tab?.id && tab.url?.startsWith("http")) {
    try {
      await api.tabs.sendMessage(tab.id, { type: "OPEN_DRAWER" });
      return;
    } catch {
      try {
        await injectAndOpenDrawer(tab.id);
        return;
      } catch (error) {
        console.warn("Drawer injection failed:", error);
      }
    }
  }

  api.windows.create({
    url: api.runtime.getURL("panel.html"),
    type: "popup",
    width: 440,
    height: 780,
    focused: true
  });
}

api.action.onClicked.addListener(() => {
  openPanel();
});

api.commands.onCommand.addListener((command) => {
  if (command === "_execute_action") openPanel();
});

async function queuePrompt(template, { customText = "", selection = "" } = {}) {
  await openPanel();
  const tab = await getActiveTab();
  if (!tab?.id) return;

  try {
    await api.tabs.sendMessage(tab.id, {
      type: "RUN_API_PROMPT",
      template,
      customText,
      selection: selection || ""
    });
  } catch {
    /* panel opened */
  }
}

api.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === MENU_ASK) {
    await queuePrompt("selection", { selection: info.selectionText || "" });
    return;
  }
  if (info.menuItemId === MENU_SUMMARIZE) {
    await queuePrompt("summarize");
  }
});

async function loadAllApiKeys() {
  return api.storage.local.get([...API_KEY_STORAGE_KEYS, "ollamaUrl", "ollamaModel"]);
}

async function resolveProvider(preferred, strict = false) {
  const keys = await loadAllApiKeys();
  const normalized = preferred === "openai" ? "chatgpt" : preferred;

  if (strict && normalized) {
    const ready = await providerIsReady(normalized, keys, keys.ollamaUrl);
    return {
      provider: ready ? normalized : null,
      configured: getConfiguredList(keys)
    };
  }

  const { apiProvider } = await api.storage.sync.get({ apiProvider: "gemini" });
  const saved = apiProvider === "openai" ? "chatgpt" : apiProvider;
  const tryOrder = [...new Set([normalized, saved, ...API_PROVIDER_IDS].filter(Boolean))];

  for (const id of tryOrder) {
    if (await providerIsReady(id, keys, keys.ollamaUrl)) {
      return { provider: id, configured: getConfiguredList(keys) };
    }
  }

  return { provider: null, configured: getConfiguredList(keys) };
}

function getConfiguredList(keys) {
  return API_PROVIDER_IDS.filter((id) => providerHasKey(id, keys)).map((id) => API_PROVIDERS[id].label);
}

api.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  if (message.type === "GET_PAGE_CONTEXT") {
    getActiveTab().then(async (tab) => {
      if (!tab?.id) {
        sendResponse({ context: null });
        return;
      }
      try {
        const results = await api.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => ({
            title: document.title || "",
            url: location.href,
            excerpt: (document.querySelector("main, article")?.innerText || document.body?.innerText || "").slice(0, 2000),
            selection: window.getSelection()?.toString()?.trim() || ""
          })
        });
        sendResponse({ context: results?.[0]?.result || null });
      } catch {
        sendResponse({ context: null });
      }
    });
    return true;
  }

  if (message.type === "OPEN_OPTIONS") {
    api.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "OPEN_PANEL") {
    openPanel().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "API_CHAT") {
    handleApiChat(message)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === "RESOLVE_PROVIDER") {
    resolveProvider(message.preferred, message.strict)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === "LIST_PROVIDERS") {
    loadAllApiKeys().then(async (keys) => {
      const list = await Promise.all(
        API_PROVIDER_IDS.map(async (id) => ({
          id,
          label: API_PROVIDERS[id].label,
          ready: await providerIsReady(id, keys, keys.ollamaUrl)
        }))
      );
      sendResponse({ providers: list });
    });
    return true;
  }
});

async function handleApiChat({ provider, userMessage, pageContext, history }) {
  const apiKeys = await loadAllApiKeys();
  const settings = await api.storage.sync.get({
    includePageContext: true,
    includeClickContext: true
  });

  const systemPrompt = buildSystemPrompt(pageContext, settings);
  const messages = [
    { role: "system", content: systemPrompt },
    ...(history || []),
    { role: "user", content: userMessage }
  ];

  const reply = await chatWithProvider(provider, {
    messages,
    apiKeys,
    ollamaUrl: apiKeys.ollamaUrl || "http://localhost:11434",
    ollamaModel: apiKeys.ollamaModel || "llama3.2"
  });

  return { reply };
}
