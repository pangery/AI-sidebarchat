/** Web režim — bez API klíče, stačí být přihlášený na webu služby */
const WEB_PROVIDERS = {
  chatgpt: {
    label: "ChatGPT",
    url: "https://chatgpt.com/"
  },
  gemini: {
    label: "Google Gemini",
    url: "https://gemini.google.com/"
  },
  perplexity: {
    label: "Perplexity",
    url: "https://www.perplexity.ai/"
  },
  grok: {
    label: "Grok (xAI)",
    url: "https://grok.com/"
  },
  claude: {
    label: "Claude",
    url: "https://claude.ai/"
  },
  copilot: {
    label: "Microsoft Copilot",
    url: "https://copilot.microsoft.com/"
  },
  deepseek: {
    label: "DeepSeek",
    url: "https://chat.deepseek.com/"
  },
  mistral: {
    label: "Mistral Le Chat",
    url: "https://chat.mistral.ai/"
  },
  meta: {
    label: "Meta AI",
    url: "https://www.meta.ai/"
  },
  poe: {
    label: "Poe",
    url: "https://poe.com/"
  },
  huggingface: {
    label: "HuggingChat",
    url: "https://huggingface.co/chat/"
  },
  youcom: {
    label: "You.com",
    url: "https://you.com/"
  },
  pi: {
    label: "Pi",
    url: "https://pi.ai/"
  },
  qwen: {
    label: "Qwen Chat",
    url: "https://chat.qwen.ai/"
  }
};

/** Pořadí v dropdownu — nejpopulárnější nahoře */
const WEB_PROVIDER_ORDER = [
  "chatgpt",
  "gemini",
  "perplexity",
  "grok",
  "claude",
  "copilot",
  "deepseek",
  "mistral",
  "meta",
  "poe",
  "huggingface",
  "youcom",
  "pi",
  "qwen"
];

const WEB_PROVIDER_IDS = WEB_PROVIDER_ORDER.filter((id) => id in WEB_PROVIDERS);

const WEB_PROVIDER_LABELS = Object.fromEntries(
  WEB_PROVIDER_IDS.map((id) => [id, WEB_PROVIDERS[id].label])
);

function getWebProviderHostnames() {
  const hosts = new Set();
  for (const p of Object.values(WEB_PROVIDERS)) {
    try {
      hosts.add(new URL(p.url).hostname);
    } catch {
      /* skip */
    }
  }
  return [...hosts];
}

const WEB_PROVIDER_HOSTNAMES = getWebProviderHostnames();

const API_PROVIDERS = {
  chatgpt: {
    label: "ChatGPT",
    model: "gpt-4o-mini",
    keyName: "apiKey_openai",
    kind: "openai",
    docs: "https://platform.openai.com/api-keys"
  },
  gemini: {
    label: "Google Gemini",
    model: "gemini-2.0-flash",
    keyName: "apiKey_gemini",
    kind: "gemini",
    docs: "https://aistudio.google.com/apikey"
  },
  claude: {
    label: "Anthropic Claude",
    model: "claude-3-5-haiku-latest",
    keyName: "apiKey_claude",
    kind: "claude",
    docs: "https://console.anthropic.com/settings/keys"
  },
  perplexity: {
    label: "Perplexity",
    model: "sonar",
    keyName: "apiKey_perplexity",
    kind: "openai",
    baseUrl: "https://api.perplexity.ai",
    docs: "https://www.perplexity.ai/settings/api"
  },
  grok: {
    label: "Grok (xAI)",
    model: "grok-2-1212",
    keyName: "apiKey_grok",
    kind: "openai",
    baseUrl: "https://api.x.ai/v1",
    docs: "https://console.x.ai"
  },
  mistral: {
    label: "Mistral AI",
    model: "mistral-small-latest",
    keyName: "apiKey_mistral",
    kind: "openai",
    baseUrl: "https://api.mistral.ai/v1",
    docs: "https://console.mistral.ai/api-keys"
  },
  deepseek: {
    label: "DeepSeek",
    model: "deepseek-chat",
    keyName: "apiKey_deepseek",
    kind: "openai",
    baseUrl: "https://api.deepseek.com",
    docs: "https://platform.deepseek.com/api_keys"
  },
  ollama: {
    label: "Ollama (lokální)",
    model: "llama3.2",
    keyName: null,
    kind: "ollama",
    docs: "https://ollama.com"
  }
};

const API_PROVIDER_IDS = Object.keys(API_PROVIDERS);

const API_PROVIDER_LABELS = Object.fromEntries(
  API_PROVIDER_IDS.map((id) => [id, API_PROVIDERS[id].label])
);

const API_KEY_STORAGE_KEYS = API_PROVIDER_IDS.map((id) => API_PROVIDERS[id].keyName).filter(Boolean);

function cleanText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function buildPagePrompt({
  title,
  url,
  excerpt,
  selection,
  template,
  customText,
  lastClick
}) {
  const parts = [];

  if (template === "summarize") {
    parts.push("Shrň obsah této webové stránky stručně a přehledně.");
  } else if (template === "explain") {
    parts.push("Vysvětli obsah této webové stránky jednoduše.");
  } else if (template === "activity") {
    parts.push(
      "Na jaké stránce jsem a co tu pravděpodobně dělám? Popiš to podle obsahu stránky."
    );
  } else if (template === "selection" && selection) {
    parts.push("Vysvětli tento vybraný text:");
    parts.push(`"${selection}"`);
  } else if (customText) {
    parts.push(customText);
  } else if (selection) {
    parts.push(`Odpověz v kontextu označeného textu: "${selection}"`);
  } else {
    parts.push("Odpověz v kontextu aktuální stránky.");
  }

  parts.push(`\nNázev: ${title || ""}`);
  parts.push(`URL: ${url || ""}`);
  if (lastClick) parts.push(`Poslední klik: ${lastClick}`);
  if (excerpt && template !== "selection") {
    parts.push("\nÚryvek:\n" + excerpt);
  }

  return parts.join("\n");
}

function templateToUserMessage(template) {
  if (template === "summarize") return "Shrň tuto stránku.";
  if (template === "explain") return "Vysvětli obsah této stránky.";
  if (template === "activity") return "Na jaké stránce jsem a co tu dělám?";
  return "";
}

function isApiProvider(id) {
  return id in API_PROVIDERS;
}

function getProviderKeyName(id) {
  return API_PROVIDERS[id]?.keyName || null;
}

function getProviderLabel(id) {
  return WEB_PROVIDER_LABELS[id] || API_PROVIDER_LABELS[id] || id;
}

function getWebUrl(id) {
  return WEB_PROVIDERS[id]?.url || WEB_PROVIDERS.gemini.url;
}

function isWebProvider(id) {
  return id in WEB_PROVIDERS;
}

function isWebProviderHostname(hostname) {
  if (!hostname) return false;
  return WEB_PROVIDER_HOSTNAMES.some(
    (h) => hostname === h || hostname.endsWith(`.${h}`)
  );
}
