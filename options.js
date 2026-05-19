const api = globalThis.ext ?? globalThis.browser ?? globalThis.chrome;

const form = document.getElementById("form");
const status = document.getElementById("status");
const apiSection = document.getElementById("apiSection");

const APPEARANCE_DEFAULTS = {
  panelWidth: 440,
  chatFontSize: 14,
  compactHeader: false,
  accentColor: "#10a37f",
  chatBgColor: "#f8f9fc",
  chatUserColor: "#10a37f",
  chatAssistantColor: "#ffffff"
};

const keyFields = [
  "apiKey_openai",
  "apiKey_gemini",
  "apiKey_grok",
  "apiKey_perplexity",
  "apiKey_claude",
  "apiKey_mistral",
  "apiKey_deepseek"
];

function normalizeProvider(id) {
  return id === "openai" ? "chatgpt" : id;
}

function updateApiSectionVisibility() {
  const useApi = document.getElementById("useApiMode").checked;
  apiSection.classList.toggle("is-hidden", !useApi);
}

document.getElementById("useWebMode").addEventListener("change", updateApiSectionVisibility);
document.getElementById("useApiMode").addEventListener("change", updateApiSectionVisibility);

api.storage.local.get([...keyFields, "ollamaUrl", "ollamaModel"], (local) => {
  keyFields.forEach((id) => {
    const el = document.getElementById(id);
    if (el && local[id]) el.value = local[id];
  });
  document.getElementById("ollamaUrl").value = local.ollamaUrl || "http://localhost:11434";
  document.getElementById("ollamaModel").value = local.ollamaModel || "llama3.2";
});

const panelWidthEl = document.getElementById("panelWidth");
const chatFontSizeEl = document.getElementById("chatFontSize");

panelWidthEl?.addEventListener("input", (e) => {
  document.getElementById("optPanelWidthVal").textContent = e.target.value;
});
chatFontSizeEl?.addEventListener("input", (e) => {
  document.getElementById("optFontSizeVal").textContent = e.target.value;
});

api.storage.sync.get(
  {
    aiProvider: "gemini",
    apiProvider: "gemini",
    useWebMode: true,
    useApiMode: false,
    autoAnalyzeOnOpen: false,
    includePageContext: true,
    includeClickContext: true,
    showFloatingBall: true,
    ...APPEARANCE_DEFAULTS
  },
  (sync) => {
    const provider = normalizeProvider(sync.aiProvider || sync.apiProvider);
    const radio = form.querySelector(`input[name="apiProvider"][value="${provider}"]`);
    if (radio) radio.checked = true;

    const useApi = sync.useApiMode === true;
    document.getElementById("useWebMode").checked = !useApi;
    document.getElementById("useApiMode").checked = useApi;
    document.getElementById("autoAnalyzeOnOpen").checked = sync.autoAnalyzeOnOpen === true;
    document.getElementById("includePageContext").checked = sync.includePageContext !== false;
    document.getElementById("includeClickContext").checked = sync.includeClickContext !== false;
    document.getElementById("showFloatingBall").checked = sync.showFloatingBall !== false;

    if (panelWidthEl) {
      panelWidthEl.value = sync.panelWidth || APPEARANCE_DEFAULTS.panelWidth;
      document.getElementById("optPanelWidthVal").textContent = panelWidthEl.value;
    }
    if (chatFontSizeEl) {
      chatFontSizeEl.value = sync.chatFontSize || APPEARANCE_DEFAULTS.chatFontSize;
      document.getElementById("optFontSizeVal").textContent = chatFontSizeEl.value;
    }
    document.getElementById("compactHeader").checked = sync.compactHeader === true;

    document.getElementById("accentColor").value =
      sync.accentColor || APPEARANCE_DEFAULTS.accentColor;
    document.getElementById("chatBgColor").value =
      sync.chatBgColor || APPEARANCE_DEFAULTS.chatBgColor;
    document.getElementById("chatUserColor").value =
      sync.chatUserColor || APPEARANCE_DEFAULTS.chatUserColor;
    document.getElementById("chatAssistantColor").value =
      sync.chatAssistantColor || APPEARANCE_DEFAULTS.chatAssistantColor;

    updateApiSectionVisibility();
  }
);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const local = {};
  keyFields.forEach((id) => {
    local[id] = document.getElementById(id).value.trim();
  });
  local.ollamaUrl = document.getElementById("ollamaUrl").value.trim() || "http://localhost:11434";
  local.ollamaModel = document.getElementById("ollamaModel").value.trim() || "llama3.2";

  const useApi = document.getElementById("useApiMode").checked;
  const sync = {
    aiProvider: normalizeProvider(new FormData(form).get("apiProvider")),
    apiProvider: normalizeProvider(new FormData(form).get("apiProvider")),
    useWebMode: !useApi,
    useApiMode: useApi,
    autoAnalyzeOnOpen: document.getElementById("autoAnalyzeOnOpen").checked,
    includePageContext: document.getElementById("includePageContext").checked,
    includeClickContext: document.getElementById("includeClickContext").checked,
    showFloatingBall: document.getElementById("showFloatingBall").checked,
    panelWidth: parseInt(document.getElementById("panelWidth").value, 10) || 440,
    chatFontSize: parseInt(document.getElementById("chatFontSize").value, 10) || 14,
    compactHeader: document.getElementById("compactHeader").checked,
    accentColor: document.getElementById("accentColor").value,
    chatBgColor: document.getElementById("chatBgColor").value,
    chatUserColor: document.getElementById("chatUserColor").value,
    chatAssistantColor: document.getElementById("chatAssistantColor").value
  };

  api.storage.local.set(local, () => {
    api.storage.sync.set(sync, () => {
      status.hidden = false;
      setTimeout(() => {
        status.hidden = true;
      }, 2500);
    });
  });
});
