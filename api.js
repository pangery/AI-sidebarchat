function buildSystemPrompt(pageContext, settings) {
  if (!settings?.includePageContext) {
    return "Jsi užitečný asistent v prohlížeči. Odpovídej v jazyce uživatele.";
  }

  const ctx = pageContext || {};
  const parts = [
    "Jsi AI asistent v prohlížeči. Uživatel má otevřenou stránku — vždy k ní máš přístup.",
    `Název: ${ctx.title || "(bez názvu)"}`,
    `URL: ${ctx.url || ""}`
  ];

  if (settings.includeClickContext && ctx.lastClick) {
    parts.push(`Poslední klik: ${ctx.lastClick}`);
  }
  if (ctx.selection) parts.push(`Označený text: ${ctx.selection}`);
  if (ctx.excerpt) parts.push(`\nText stránky:\n${ctx.excerpt}`);

  parts.push(
    "\nOdpovídej v jazyce dotazu. Na otázky o 'této stránce', 'kde jsem' nebo 'co tu dělám' vždy vycházej z kontextu výše."
  );

  return parts.join("\n");
}

async function parseErrorResponse(res) {
  let detail = "";
  try {
    const data = await res.json();
    detail = data.error?.message || data.message || JSON.stringify(data);
  } catch {
    detail = await res.text();
  }
  return detail || res.statusText;
}

async function chatOpenAICompatible(baseUrl, apiKey, model, messages, label) {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages, max_tokens: 2048 })
  });
  if (!res.ok) throw new Error(`${label}: ${await parseErrorResponse(res)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Prázdná odpověď.";
}

async function chatGemini(apiKey, model, messages) {
  const system = messages.find((m) => m.role === "system")?.content || "";
  const contents = [];

  for (const msg of messages) {
    if (msg.role === "system") continue;
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    });
  }

  const body = {
    contents,
    generationConfig: { maxOutputTokens: 2048 }
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Gemini: ${await parseErrorResponse(res)}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Prázdná odpověď.";
}

async function chatClaude(apiKey, model, messages) {
  const system = messages.find((m) => m.role === "system")?.content || "";
  const chatMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system,
      messages: chatMessages
    })
  });
  if (!res.ok) throw new Error(`Claude: ${await parseErrorResponse(res)}`);
  const data = await res.json();
  return data.content?.[0]?.text || "Prázdná odpověď.";
}

async function chatOllama(baseUrl, model, messages) {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false })
  });
  if (!res.ok) throw new Error(`Ollama: ${await parseErrorResponse(res)}`);
  const data = await res.json();
  return data.message?.content || "Prázdná odpověď.";
}

function missingKeyError(providerId) {
  const p = API_PROVIDERS[providerId];
  const name = p?.label || providerId;
  if (providerId === "ollama") {
    return `Ollama neběží. Spusť: ollama serve && ollama pull llama3.2`;
  }
  return `Chybí API klíč pro ${name}. Klikni ⚙ → Možnosti a vlož klíč (${p?.docs || ""}).`;
}

async function chatWithProvider(providerId, options) {
  const provider = API_PROVIDERS[providerId];
  if (!provider) throw new Error("Neznámá AI služba.");

  const { messages, apiKeys, ollamaUrl, ollamaModel } = options;
  const model = providerId === "ollama" ? ollamaModel || provider.model : provider.model;

  if (provider.kind === "ollama") {
    return chatOllama(ollamaUrl || "http://localhost:11434", model, messages);
  }

  const key = provider.keyName ? apiKeys[provider.keyName] : null;
  if (!key) throw new Error(missingKeyError(providerId));

  if (provider.kind === "gemini") {
    return chatGemini(key, model, messages);
  }
  if (provider.kind === "claude") {
    return chatClaude(key, model, messages);
  }
  if (provider.kind === "openai") {
    const base =
      provider.baseUrl ||
      (providerId === "chatgpt" ? "https://api.openai.com/v1" : "https://api.openai.com/v1");
    return chatOpenAICompatible(base, key, model, messages, provider.label);
  }

  throw new Error("Nepodporovaná služba.");
}

function providerHasKey(providerId, keys, ollamaUrl) {
  const p = API_PROVIDERS[providerId];
  if (!p) return false;
  if (p.kind === "ollama") return true;
  return Boolean(p.keyName && keys[p.keyName]);
}

async function providerIsReady(providerId, keys, ollamaUrl) {
  const p = API_PROVIDERS[providerId];
  if (!p) return false;
  if (p.kind === "ollama") {
    try {
      const base = (ollamaUrl || "http://localhost:11434").replace(/\/$/, "");
      const res = await fetch(`${base}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }
  return providerHasKey(providerId, keys);
}
