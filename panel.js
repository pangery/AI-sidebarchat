const api = globalThis.ext ?? globalThis.browser ?? globalThis.chrome;

const PROVIDERS = typeof WEB_PROVIDERS !== "undefined" ? WEB_PROVIDERS : {};
const PROVIDER_ORDER = typeof WEB_PROVIDER_ORDER !== "undefined" ? WEB_PROVIDER_ORDER : Object.keys(PROVIDERS);

const frame = document.getElementById("frame");
const blocked = document.getElementById("blocked");
const openExternal = document.getElementById("open-external");
const providerSelect = document.getElementById("provider-select");
const settingsBtn = document.getElementById("settings-btn");
const askForm = document.getElementById("ask-form");
const askInput = document.getElementById("ask-input");
const pageContext = document.getElementById("page-context");
const chipSelection = document.getElementById("chip-selection");
const toast = document.getElementById("toast");

let currentProvider = "gemini";
let pageInfo = { title: "", url: "", excerpt: "", selection: "" };
let toastTimer;

function populateProviderSelect() {
  providerSelect.innerHTML = "";
  for (const id of PROVIDER_ORDER) {
    const cfg = PROVIDERS[id];
    if (!cfg) continue;
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = cfg.label || id;
    providerSelect.appendChild(opt);
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3500);
}

function setBrandColor() {
  document.querySelector(".brand-icon").style.background = "#10a37f";
}

function updatePageContextLine() {
  if (!pageInfo.title) {
    pageContext.classList.add("hidden");
    return;
  }
  pageContext.textContent = pageInfo.title;
  pageContext.title = pageInfo.url;
  pageContext.classList.remove("hidden");
}

function showBlocked(url) {
  blocked.classList.remove("hidden");
  openExternal.onclick = () => api.tabs.create({ url });
  frame.classList.add("hidden");
}

function hideBlocked() {
  blocked.classList.add("hidden");
  frame.classList.remove("hidden");
}

function loadProvider(provider, { reload = true } = {}) {
  const config = PROVIDERS[provider];
  if (!config) return;

  currentProvider = provider;
  providerSelect.value = provider;
  setBrandColor();
  api.storage.sync.set({ aiProvider: provider, apiProvider: provider, defaultProvider: provider });

  if (!reload) return;

  hideBlocked();
  frame.src = config.url;
}

async function copyPrompt(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Zkopírováno — vlož do chatu (Ctrl+V / ⌘V)");
    askInput.value = "";
  } catch {
    askInput.value = text;
    showToast("Text je v poli výše — zkopíruj ručně");
  }
}

async function sendPrompt({ template, customText } = {}) {
  const prompt = buildPagePrompt({
    title: pageInfo.title,
    url: pageInfo.url,
    excerpt: pageInfo.excerpt,
    selection: pageInfo.selection,
    template: template || "custom",
    customText: customText || askInput.value.trim()
  });

  if (!prompt?.trim()) {
    showToast("Nepodařilo se připravit dotaz");
    return;
  }

  await copyPrompt(prompt);
}

populateProviderSelect();

providerSelect.addEventListener("change", () => {
  loadProvider(providerSelect.value);
});

settingsBtn.addEventListener("click", () => {
  api.runtime.openOptionsPage();
});

askForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!askInput.value.trim()) return;
  sendPrompt({ template: "custom" });
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    sendPrompt({ template: chip.dataset.template });
  });
});

frame.addEventListener("load", () => {
  try {
    const doc = frame.contentDocument;
    if (!doc) return;
    const text = doc.body?.innerText?.toLowerCase() ?? "";
    if (
      text.includes("refused to connect") ||
      text.includes("blocked") ||
      text.includes("x-frame-options")
    ) {
      showBlocked(PROVIDERS[currentProvider]?.url || "https://gemini.google.com/");
    }
  } catch {
    // cross-origin = OK
  }
});

api.runtime.onMessage.addListener((message) => {
  if (message.type === "PAGE_CONTEXT") {
    pageInfo = { ...pageInfo, ...message.context };
    if (pageInfo.selection) chipSelection.hidden = false;
    updatePageContextLine();
  }

  if (message.type === "PENDING_PROMPT") {
    copyPrompt(message.prompt);
  }
});

async function refreshPageContext() {
  const response = await api.runtime.sendMessage({ type: "GET_PAGE_CONTEXT" });
  if (response?.context) {
    pageInfo = response.context;
    if (pageInfo.selection) chipSelection.hidden = false;
    updatePageContextLine();
  }
}

api.storage.sync.get({ aiProvider: "gemini", defaultProvider: "gemini" }, (data) => {
  const provider = data.aiProvider || data.defaultProvider || "gemini";
  const id = provider in PROVIDERS ? provider : "gemini";
  loadProvider(id, { reload: true });
});

api.storage.session.get(
  { pendingPrompt: null, pendingSelection: "" },
  ({ pendingPrompt, pendingSelection }) => {
    if (pendingSelection) {
      pageInfo.selection = pendingSelection;
      chipSelection.hidden = false;
    }
    if (pendingPrompt) {
      copyPrompt(pendingPrompt);
      api.storage.session.remove(["pendingPrompt", "pendingSelection"]);
    }
  }
);

api.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.aiProvider || changes.defaultProvider)) {
    const id = changes.aiProvider?.newValue || changes.defaultProvider?.newValue;
    if (id && id in PROVIDERS) loadProvider(id);
  }
  if (area !== "session") return;
  if (changes.pendingPrompt?.newValue) {
    copyPrompt(changes.pendingPrompt.newValue);
    api.storage.session.remove(["pendingPrompt", "pendingSelection"]);
  }
  if (changes.pendingSelection?.newValue) {
    pageInfo.selection = changes.pendingSelection.newValue;
    chipSelection.hidden = !pageInfo.selection;
  }
});

refreshPageContext();
setInterval(refreshPageContext, 5000);
