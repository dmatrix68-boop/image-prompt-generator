/* The Prompt Engine — Uncensored (OpenRouter Edition)
 * Reines Frontend: API-Key & Verlauf bleiben im Browser (localStorage),
 * Requests gehen direkt an https://openrouter.ai — kein eigener Server nötig. */

"use strict";

const OR_BASE = "https://openrouter.ai/api/v1";
const LS = { key: "pe_api_key", model: "pe_model", history: "pe_history", lang: "pe_lang" };

/* Empfohlene Vision-Modelle mit unmoderierten Endpoints (Stand: Juli 2026).
 * Die Liste wird zur Laufzeit um alle Vision-Modelle aus dem Live-Katalog ergänzt. */
const RECOMMENDED_MODELS = [
  { id: "qwen/qwen3-vl-235b-a22b-instruct", de: "Qwen3 VL 235B — beste Qualität, unmoderiert", en: "Qwen3 VL 235B — best quality, unmoderated" },
  { id: "qwen/qwen3-vl-30b-a3b-instruct", de: "Qwen3 VL 30B — schnell & günstig, unmoderiert", en: "Qwen3 VL 30B — fast & cheap, unmoderated" },
  { id: "qwen/qwen3-vl-32b-instruct", de: "Qwen3 VL 32B — unmoderiert", en: "Qwen3 VL 32B — unmoderated" },
  { id: "qwen/qwen2.5-vl-72b-instruct", de: "Qwen2.5 VL 72B — unmoderiert", en: "Qwen2.5 VL 72B — unmoderated" },
  { id: "x-ai/grok-4.5", de: "Grok 4.5 — stark, wenig restriktiv", en: "Grok 4.5 — strong, few restrictions" },
];
const DEFAULT_MODEL = RECOMMENDED_MODELS[0].id;

/* ---------- i18n ----------
 * Deutsch ist die Basissprache und steht direkt im HTML; beim Start wird sie als
 * Snapshot gesichert. UI_EN enthält die englischen Texte für alle [data-i18n*]-
 * Elemente, MSG die dynamischen Meldungen in beiden Sprachen. */
let lang = localStorage.getItem(LS.lang) === "en" ? "en" : "de";

const UI_EN = {
  tagline: "Uncensored Image-to-Prompt Generator · powered by OpenRouter",
  settingsBtn: "⚙️ Settings",
  "tab.image": "🖼️ Image → Prompt",
  "tab.text": "💡 Idea → Prompt",
  "drop.hint": "<strong>Drag an image here</strong>, click to select<br>or paste with <kbd>Ctrl</kbd>+<kbd>V</kbd>",
  "img.clear": "✕ Remove image",
  "img.extra.label": "Additional instruction (optional)",
  "img.extra.ph": "e.g. “focus on the lighting mood”, “describe as an anime version” …",
  "idea.label": "Your idea",
  "idea.ph": "Briefly describe what you want to generate — the engine turns it into a detailed professional prompt.",
  "opt.platform": "Target platform",
  "plat.sdxl": "Stable Diffusion / SDXL (tags + negative)",
  "plat.pony": "Pony / Illustrious (booru tags)",
  "plat.flux": "Flux (natural language)",
  "plat.mj": "Midjourney (with --parameters)",
  "plat.dalle": "DALL-E (natural language)",
  "plat.ideogram": "Ideogram (natural language, text rendering)",
  "plat.nano": "Nano Banana / Gemini (natural language)",
  "plat.qwen": "Qwen-Image (natural language, text rendering)",
  "plat.krea2": "Krea 2 (photorealistic, natural language)",
  "plat.generic": "Universal / other generators",
  "opt.style": "Style",
  "style.auto": "Automatic (derive from image/idea)",
  "style.photo": "Photorealistic",
  "style.cine": "Cinematic",
  "style.anime": "Anime / Manga",
  "style.digital": "Digital art / illustration",
  "style.3d": "3D render",
  "style.paint": "Painting / classical",
  "opt.detail": "Detail level",
  "detail.normal": "Normal",
  "detail.high": "High",
  "detail.extreme": "Extreme (every little thing)",
  "ratio.label": "Image format (aspect ratio)",
  "logic.label": "Logic Mode (strictly logical, precise prompt construction)",
  "nsfw.label": "NSFW allowed (describe explicit content uncensored)",
  "variations.label": "Generate 3 variations",
  "generate.btn": "⚡ Generate prompt",
  "result.h": "Result",
  "copy.btn": "📋 Copy",
  "again.btn": "🔄 Regenerate",
  "output.ph": "The generated prompt will appear here.",
  "history.summary": "History (stored locally)",
  "history.clear": "Clear history",
  "dlg.h": "⚙️ Settings",
  "dlg.key.label": "OpenRouter API key",
  "dlg.key.small": 'Stored only locally in your browser (localStorage) and sent directly to openrouter.ai. Create a key: <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a>',
  "dlg.model.label": "Vision model",
  "dlg.model.small": "Recommended for uncensored analysis: Qwen3-VL (unmoderated endpoints). Big-vendor models (GPT, Claude, Gemini) usually refuse NSFW images.",
  "dlg.custom.label": "Custom model ID (overrides selection, optional)",
  "dlg.refresh": "🔄 Load model list",
  "dlg.save": "Save",
  "dlg.legal": "For adult users only. No analysis of depictions of minors or non-consensual real content — such requests are refused. You are responsible for complying with your model provider's terms of use.",
};

const MSG = {
  de: {
    welcome: "Willkommen! Hinterlege zuerst deinen OpenRouter API-Key unter ⚙️ Einstellungen.",
    noKey: "Kein API-Key hinterlegt — bitte in den Einstellungen eintragen.",
    noImage: "Bitte zuerst ein Bild auswählen.",
    noIdea: "Bitte zuerst eine Idee eingeben.",
    generating: "Generiere mit {m} …",
    done: "Fertig.",
    copied: "In die Zwischenablage kopiert.",
    saved: "Gespeichert. Aktives Modell: {m}",
    modelsLoaded: "{n} Vision-Modelle geladen.",
    modelsError: "Modellliste konnte nicht geladen werden ({e}) — empfohlene Modelle bleiben verfügbar.",
    emptyResponse: "(leere Antwort — anderes Modell probieren)",
    error: "Fehler: {e}",
    err401: " — API-Key ungültig.",
    err404: " — Modell nicht verfügbar, bitte in den Einstellungen ein anderes wählen.",
    historyRestore: "Klicken zum Wiederherstellen",
    techNone: "— (nicht vorgeben)",
    techDefault: "Default (Standard wählen)",
    grpRec: "Empfohlen (unzensiert)",
    grpAll: "Alle Vision-Modelle (live von OpenRouter)",
  },
  en: {
    welcome: "Welcome! First add your OpenRouter API key under ⚙️ Settings.",
    noKey: "No API key set — please add one in the settings.",
    noImage: "Please select an image first.",
    noIdea: "Please enter an idea first.",
    generating: "Generating with {m} …",
    done: "Done.",
    copied: "Copied to clipboard.",
    saved: "Saved. Active model: {m}",
    modelsLoaded: "{n} vision models loaded.",
    modelsError: "Could not load the model list ({e}) — the recommended models remain available.",
    emptyResponse: "(empty response — try another model)",
    error: "Error: {e}",
    err401: " — invalid API key.",
    err404: " — model not available, please pick another one in the settings.",
    historyRestore: "Click to restore",
    techNone: "— (unset)",
    techDefault: "Default (pick a standard)",
    grpRec: "Recommended (uncensored)",
    grpAll: "All vision models (live from OpenRouter)",
  },
};

function t(key, vars = {}) {
  let s = MSG[lang][key] ?? MSG.de[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

const deSnapshot = { text: {}, html: {}, ph: {} };

function initI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => { deSnapshot.text[el.dataset.i18n] = el.textContent; });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { deSnapshot.html[el.dataset.i18nHtml] = el.innerHTML; });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { deSnapshot.ph[el.dataset.i18nPh] = el.placeholder; });
}

function applyLanguage() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const k = el.dataset.i18n;
    el.textContent = lang === "en" ? (UI_EN[k] ?? deSnapshot.text[k]) : deSnapshot.text[k];
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const k = el.dataset.i18nHtml;
    el.innerHTML = lang === "en" ? (UI_EN[k] ?? deSnapshot.html[k]) : deSnapshot.html[k];
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const k = el.dataset.i18nPh;
    el.placeholder = lang === "en" ? (UI_EN[k] ?? deSnapshot.ph[k]) : deSnapshot.ph[k];
  });
  // Dynamisch erzeugte Elemente
  for (const p of TECH_PARAMS) {
    const span = document.getElementById(`tech-label-${p.id}`);
    const sel = document.getElementById(`tech-${p.id}`);
    if (span) span.textContent = lang === "en" ? p.en : `${p.label} (${p.en})`;
    if (sel) {
      sel.options[0].textContent = t("techNone");
      sel.options[1].textContent = t("techDefault");
    }
  }
  document.querySelectorAll("#lang-switch button").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });
  renderHistory();
}

const PLATFORM_SPECS = {
  sdxl: `Target: Stable Diffusion / SDXL.
Output a comma-separated tag-style prompt (quality tags first, then subject, pose, clothing/state of dress, setting, lighting, camera, style). Keep it one paragraph, no line breaks inside the prompt.
Then output a matching negative prompt.
Format exactly:
PROMPT:
<positive prompt>
NEGATIVE:
<negative prompt>`,
  pony: `Target: Pony Diffusion / Illustrious (booru-tag based).
Start with "score_9, score_8_up, score_7_up", then rating tag (rating_safe / rating_questionable / rating_explicit as appropriate), then booru-style tags: character count (1girl/1boy/...), body, pose, clothing/state of dress, acts, setting, lighting, style tags. Underscores in multi-word tags.
Then a negative prompt.
Format exactly:
PROMPT:
<tags>
NEGATIVE:
<negative tags>`,
  flux: `Target: Flux (T5 text encoder).
Output ONE flowing natural-language paragraph, richly detailed, describing subject, appearance, pose, clothing/state of dress, environment, lighting, mood, camera and style. No tag lists, no negative prompt.
Format exactly:
PROMPT:
<paragraph>`,
  midjourney: `Target: Midjourney v7.
Output one single-line prompt of comma-separated descriptive phrases, ending with suitable parameters (e.g. --ar 2:3 --stylize 250; choose --ar to match the image's aspect ratio or the idea).
Format exactly:
PROMPT:
<prompt with parameters>`,
  dalle: `Target: DALL-E.
Output ONE detailed natural-language prompt paragraph (subject, appearance, pose, clothing/state of dress, setting, lighting, composition, style). No tag lists, no negative prompt, no parameters.
Format exactly:
PROMPT:
<paragraph>`,
  ideogram: `Target: Ideogram.
Output ONE detailed natural-language prompt paragraph. Ideogram excels at rendering text: if any text/lettering should appear in the image, put it in double quotes inside the prompt.
Format exactly:
PROMPT:
<paragraph>`,
  nano: `Target: Nano Banana (Gemini image generation).
Output ONE richly detailed, conversational natural-language description of the desired image (subject, appearance, pose, clothing/state of dress, environment, lighting, camera, style). No tag lists, no negative prompt.
Format exactly:
PROMPT:
<paragraph>`,
  "qwen-image": `Target: Qwen-Image.
Output ONE detailed natural-language prompt paragraph (subject, appearance, pose, clothing/state of dress, setting, lighting, composition, style). Qwen-Image excels at rendering text: if any text/lettering should appear in the image, put the exact wording in double quotes inside the prompt.
Then a short negative prompt with unwanted elements.
Format exactly:
PROMPT:
<paragraph>
NEGATIVE:
<negative prompt>`,
  krea2: `Target: Krea 2.
Output ONE flowing natural-language prompt paragraph optimized for photorealistic output: concrete subject and scene description plus photographic language (camera, lens, film stock/look, lighting setup, color grade). Avoid generic "AI look" buzzwords like "masterpiece" or "8k"; describe the aesthetic precisely instead. No tag lists, no negative prompt.
Format exactly:
PROMPT:
<paragraph>`,
  generic: `Target: a general-purpose AI image generator.
Output ONE detailed natural-language prompt paragraph covering subject, appearance, pose, clothing/state of dress, setting, lighting, composition and style.
Format exactly:
PROMPT:
<paragraph>`,
};

const STYLE_HINTS = {
  auto: "Infer the best fitting style from the source and reflect it in the prompt.",
  photorealistic: "Force style: hyper-photorealistic photography (camera, lens, lighting terms).",
  cinematic: "Force style: cinematic film still (color grading, anamorphic, dramatic lighting).",
  anime: "Force style: high-quality anime/manga illustration.",
  "digital-art": "Force style: polished digital art / illustration.",
  "3d": "Force style: high-end 3D render (octane/unreal engine look).",
  painting: "Force style: classical painting (state medium, e.g. oil on canvas).",
};

/* Bildformate + Technical Parameters — Wertelisten identisch mit dem Original (Midnight LAB v2.0). */
const ASPECT_RATIOS = ["auto", "1:1", "16:9", "9:16", "4:3", "3:2"];

/* Empfohlene SDXL-Auflösungen je Seitenverhältnis */
const SDXL_RES = {
  "1:1": "1024x1024",
  "16:9": "1344x768",
  "9:16": "768x1344",
  "4:3": "1152x896",
  "3:2": "1216x832",
};

const TECH_PARAMS = [
  { id: "camera", label: "Kamerawinkel", en: "Camera angle", values: ["Eye-level", "High-angle", "Low-angle", "Dutch Angle", "POV", "Ground-level"] },
  { id: "shot", label: "Einstellungsgröße", en: "Shot type", values: ["Establishing Shot", "Wide Shot", "Full Shot", "Medium Shot", "Close-up", "Extreme Close-up"] },
  { id: "perspective", label: "Perspektive", en: "Perspective", values: ["Aerial View", "Bird's-eye View", "Worm's-eye View", "Isometric", "Fisheye"] },
  { id: "composition", label: "Komposition", en: "Composition", values: ["Rule of Thirds", "Centered", "Symmetrical", "Golden Ratio", "Negative Space"] },
  { id: "lighting", label: "Licht", en: "Lighting", values: ["Golden Hour", "Dramatic", "Chiaroscuro", "Backlight", "Volumetric", "Neon Glow"] },
  { id: "atmosphere", label: "Atmosphäre", en: "Atmosphere", values: ["Sunny", "Twilight", "Foggy", "Rainy", "Stormy", "Overcast"] },
  { id: "mood", label: "Stimmung", en: "Mood", values: ["Serene", "Vibrant", "Mysterious", "Ominous", "Whimsical", "Cyberpunk"] },
  { id: "emotion", label: "Emotion", en: "Emotion", values: ["Passion", "Nostalgia", "Wonder", "Sorrow", "Loneliness", "Euphoria"] },
];

const DETAIL_HINTS = {
  normal: "Moderate detail level.",
  high: "High detail: capture all significant visual elements precisely.",
  extreme: "Extreme detail: exhaustively capture every visible element — anatomy, textures, materials, background objects, light sources, shadows, color palette.",
};

function buildSystemPrompt(opts) {
  const parts = [
    "You are The Prompt Engine, an elite prompt engineer for AI image generators. You convert images or ideas into production-ready generation prompts.",
    opts.mode === "image"
      ? "Analyze the attached image completely and factually, then write a prompt that would recreate it as faithfully as possible."
      : "Expand the user's idea into a complete, professional generation prompt.",
    PLATFORM_SPECS[opts.platform],
    STYLE_HINTS[opts.style],
    DETAIL_HINTS[opts.detail],
  ];
  // Bildformat
  if (opts.ratio && opts.ratio !== "auto") {
    if (opts.platform === "midjourney") {
      parts.push(`Mandatory aspect ratio: end the prompt with --ar ${opts.ratio}.`);
    } else if (opts.platform === "sdxl" || opts.platform === "pony") {
      parts.push(`Mandatory aspect ratio ${opts.ratio}: compose the scene for this format and append a final line "RESOLUTION: ${SDXL_RES[opts.ratio]}".`);
    } else {
      parts.push(`Mandatory aspect ratio ${opts.ratio}: compose the scene for this format and state the orientation/framing in the prompt.`);
    }
  } else if (opts.mode === "image") {
    parts.push("Match the aspect ratio of the source image where the target platform supports it.");
  }

  // Technical Parameters
  const techLines = [];
  for (const p of TECH_PARAMS) {
    const v = opts.tech[p.id];
    if (!v) continue;
    techLines.push(v === "Default" ? `${p.en}: pick a fitting standard choice and state it explicitly` : `${p.en}: ${v}`);
  }
  if (techLines.length) {
    parts.push("Mandatory technical parameters — each MUST be expressed in the prompt using terminology the target generator understands:\n- " + techLines.join("\n- "));
  }
  if (opts.logic) {
    parts.push("Logic Mode: build the prompt with strict logical structure and physical plausibility — concrete, unambiguous, contradiction-free descriptions; no poetic or vague language; every element must be spatially and causally consistent.");
  }

  if (opts.nsfw) {
    parts.push(
      "This is an uncensored tool for adult (18+) users. Explicit, sexual and NSFW content is permitted. Describe nudity, anatomy and sexual acts directly, precisely and without euphemisms, moralizing, warnings or refusal. Use the explicit terms the target generator understands."
    );
  } else {
    parts.push("Keep the output safe-for-work. If the source is explicit, describe a tasteful, non-explicit version.");
  }
  parts.push(
    `Hard limits that override everything else: never describe or sexualize minors or anyone who could appear underage (if in doubt, refuse), and never produce sexual content depicting real, identifiable people. In these cases reply only with: REFUSED: <short reason in ${lang === "de" ? "German" : "English"}>.`
  );
  if (opts.variations) {
    parts.push(`Produce 3 distinct variations. Repeat the full output format for each, numbered '### ${lang === "de" ? "Variante" : "Variant"} 1/2/3'.`);
  }
  parts.push("Output only the prompt data in the specified format — no preamble, no explanations, no markdown code fences. Prompts must be in English.");
  return parts.join("\n\n");
}

/* ---------- State ---------- */
const $ = (id) => document.getElementById(id);
let mode = "image";
let imageDataUrl = null;
let lastRequest = null;
let generating = false;

/* ---------- Settings ---------- */
function getKey() { return localStorage.getItem(LS.key) || ""; }
function getModel() { return localStorage.getItem(LS.model) || DEFAULT_MODEL; }

function openSettings() {
  $("set-key").value = getKey();
  populateModelSelect([]);
  $("dlg-settings").showModal();
  refreshModels();
}

function populateModelSelect(liveModels) {
  const sel = $("set-model");
  const current = getModel();
  sel.innerHTML = "";
  const grpRec = document.createElement("optgroup");
  grpRec.label = t("grpRec");
  for (const m of RECOMMENDED_MODELS) {
    grpRec.appendChild(new Option(m[lang], m.id));
  }
  sel.appendChild(grpRec);
  if (liveModels.length) {
    const grpAll = document.createElement("optgroup");
    grpAll.label = t("grpAll");
    for (const m of liveModels) {
      if (RECOMMENDED_MODELS.some((r) => r.id === m.id)) continue;
      grpAll.appendChild(new Option(m.name || m.id, m.id));
    }
    sel.appendChild(grpAll);
  }
  if ([...sel.options].some((o) => o.value === current)) {
    sel.value = current;
    $("set-model-custom").value = "";
  } else {
    $("set-model-custom").value = current;
  }
}

async function refreshModels() {
  try {
    const res = await fetch(`${OR_BASE}/models`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();
    const vision = data
      .filter((m) => (m.architecture?.input_modalities || []).includes("image"))
      .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
    populateModelSelect(vision);
    setStatus(t("modelsLoaded", { n: vision.length }), "ok");
  } catch (e) {
    setStatus(t("modelsError", { e: e.message }), "error");
  }
}

function saveSettings() {
  localStorage.setItem(LS.key, $("set-key").value.trim());
  const custom = $("set-model-custom").value.trim();
  localStorage.setItem(LS.model, custom || $("set-model").value || DEFAULT_MODEL);
  $("dlg-settings").close();
  setStatus(t("saved", { m: getModel() }), "ok");
}

/* ---------- Image handling ---------- */
const MAX_DIM = 1792;

function loadImageFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => downscale(reader.result);
  reader.readAsDataURL(file);
}

function downscale(dataUrl) {
  const img = new Image();
  img.onload = () => {
    let { width: w, height: h } = img;
    if (Math.max(w, h) > MAX_DIM) {
      const f = MAX_DIM / Math.max(w, h);
      w = Math.round(w * f);
      h = Math.round(h * f);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      imageDataUrl = c.toDataURL("image/jpeg", 0.92);
    } else {
      imageDataUrl = dataUrl;
    }
    $("preview").src = imageDataUrl;
    $("preview").hidden = false;
    $("drop-hint").hidden = true;
    $("btn-clear-img").hidden = false;
  };
  img.src = dataUrl;
}

function clearImage() {
  imageDataUrl = null;
  $("preview").hidden = true;
  $("preview").src = "";
  $("drop-hint").hidden = false;
  $("btn-clear-img").hidden = true;
  $("file-input").value = "";
}

/* ---------- Generation ---------- */
function setStatus(msg, cls = "") {
  const el = $("status");
  el.textContent = msg;
  el.className = `status ${cls}`;
}

function collectOptions() {
  const tech = {};
  for (const p of TECH_PARAMS) tech[p.id] = $(`tech-${p.id}`).value;
  return {
    mode,
    platform: $("opt-platform").value,
    style: $("opt-style").value,
    detail: $("opt-detail").value,
    ratio: document.querySelector(".ratio-btn.active")?.dataset.ratio || "auto",
    tech,
    logic: $("opt-logic").checked,
    nsfw: $("opt-nsfw").checked,
    variations: $("opt-variations").checked,
  };
}

async function generate(repeat = false) {
  if (generating) return;
  if (!getKey()) {
    setStatus(t("noKey"), "error");
    openSettings();
    return;
  }

  let request;
  if (repeat && lastRequest) {
    request = lastRequest;
  } else {
    const opts = collectOptions();
    const userContent = [];
    if (mode === "image") {
      if (!imageDataUrl) {
        setStatus(t("noImage"), "error");
        return;
      }
      const extra = $("image-extra").value.trim();
      userContent.push({
        type: "text",
        text: "Analyze this image and generate the prompt." + (extra ? ` Additional instruction: ${extra}` : ""),
      });
      userContent.push({ type: "image_url", image_url: { url: imageDataUrl } });
    } else {
      const idea = $("text-idea").value.trim();
      if (!idea) {
        setStatus(t("noIdea"), "error");
        return;
      }
      userContent.push({ type: "text", text: `Idea: ${idea}` });
    }
    request = {
      model: getModel(),
      messages: [
        { role: "system", content: buildSystemPrompt(opts) },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      max_tokens: opts.variations ? 3000 : 1200,
      stream: true,
    };
    lastRequest = request;
  }

  generating = true;
  $("btn-generate").disabled = true;
  $("btn-copy").hidden = true;
  $("btn-again").hidden = true;
  const out = $("output");
  out.textContent = "";
  setStatus(t("generating", { m: request.model }));

  try {
    const res = await fetch(`${OR_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getKey()}`,
        "Content-Type": "application/json",
        "X-Title": "The Prompt Engine (Uncensored)",
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        detail = err.error?.message || detail;
      } catch { /* leave detail */ }
      if (res.status === 401) detail += t("err401");
      if (res.status === 404) detail += t("err404");
      throw new Error(detail);
    }

    const text = await readStream(res, (partial) => { out.textContent = partial; });
    out.textContent = text.trim() || t("emptyResponse");
    setStatus(t("done"), "ok");
    $("btn-copy").hidden = false;
    $("btn-again").hidden = false;
    if (text.trim()) addHistory(text.trim(), request.model);
  } catch (e) {
    out.innerHTML = "";
    setStatus(t("error", { e: e.message }), "error");
  } finally {
    generating = false;
    $("btn-generate").disabled = false;
  }
}

async function readStream(res, onPartial) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return text;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          text += delta;
          onPartial(text);
        }
      } catch { /* partial JSON line, wait for more */ }
    }
  }
  return text;
}

/* ---------- History ---------- */
function getHistory() {
  try { return JSON.parse(localStorage.getItem(LS.history)) || []; } catch { return []; }
}

function addHistory(text, model) {
  const h = getHistory();
  h.unshift({ t: Date.now(), model, text });
  localStorage.setItem(LS.history, JSON.stringify(h.slice(0, 30)));
  renderHistory();
}

function renderHistory() {
  const box = $("history");
  box.innerHTML = "";
  for (const item of getHistory()) {
    const div = document.createElement("div");
    div.className = "history-item";
    const date = new Date(item.t).toLocaleString(lang === "de" ? "de-DE" : "en-US");
    div.textContent = `[${date}] ${item.text.replace(/\s+/g, " ").slice(0, 110)}`;
    div.title = t("historyRestore");
    div.addEventListener("click", () => {
      $("output").textContent = item.text;
      $("btn-copy").hidden = false;
    });
    box.appendChild(div);
  }
}

/* ---------- Wiring ---------- */
const ratioRow = $("ratio-row");
for (const r of ASPECT_RATIOS) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ratio-btn" + (r === "auto" ? " active" : "");
  btn.dataset.ratio = r;
  btn.textContent = r === "auto" ? "Auto" : r;
  btn.addEventListener("click", () => {
    ratioRow.querySelectorAll(".ratio-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
  ratioRow.appendChild(btn);
}

const techGrid = $("tech-grid");
for (const p of TECH_PARAMS) {
  const label = document.createElement("label");
  label.className = "field";
  const span = document.createElement("span");
  span.id = `tech-label-${p.id}`;
  span.textContent = `${p.label} (${p.en})`;
  const sel = document.createElement("select");
  sel.id = `tech-${p.id}`;
  sel.appendChild(new Option(t("techNone"), ""));
  sel.appendChild(new Option(t("techDefault"), "Default"));
  for (const v of p.values) sel.appendChild(new Option(v, v));
  label.append(span, sel);
  techGrid.appendChild(label);
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    mode = tab.dataset.mode;
    $("pane-image").hidden = mode !== "image";
    $("pane-text").hidden = mode !== "text";
  });
});

const dz = $("dropzone");
dz.addEventListener("click", (e) => {
  if (e.target.id !== "btn-clear-img") $("file-input").click();
});
$("file-input").addEventListener("change", (e) => loadImageFile(e.target.files[0]));
dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("drag"); });
dz.addEventListener("dragleave", () => dz.classList.remove("drag"));
dz.addEventListener("drop", (e) => {
  e.preventDefault();
  dz.classList.remove("drag");
  loadImageFile(e.dataTransfer.files[0]);
});
document.addEventListener("paste", (e) => {
  const file = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"))?.getAsFile();
  if (file) {
    loadImageFile(file);
    document.querySelector('.tab[data-mode="image"]').click();
  }
});
$("btn-clear-img").addEventListener("click", clearImage);

$("btn-generate").addEventListener("click", () => generate(false));
$("btn-again").addEventListener("click", () => generate(true));
$("btn-copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("output").textContent);
  setStatus(t("copied"), "ok");
});

document.querySelectorAll("#lang-switch button").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.lang === lang) return;
    lang = btn.dataset.lang;
    localStorage.setItem(LS.lang, lang);
    applyLanguage();
  });
});

$("btn-settings").addEventListener("click", openSettings);
$("btn-save-settings").addEventListener("click", saveSettings);
$("btn-refresh-models").addEventListener("click", refreshModels);
$("btn-clear-history").addEventListener("click", () => {
  localStorage.removeItem(LS.history);
  renderHistory();
});

initI18n();
applyLanguage();
if (!getKey()) setStatus(t("welcome"));
