/* The Prompt Engine — Uncensored (OpenRouter Edition)
 * Reines Frontend: API-Key & Verlauf bleiben im Browser (localStorage),
 * Requests gehen direkt an https://openrouter.ai — kein eigener Server nötig. */

"use strict";

const OR_BASE = "https://openrouter.ai/api/v1";
const LS = { key: "pe_api_key", model: "pe_model", history: "pe_history" };

/* Empfohlene Vision-Modelle mit unmoderierten Endpoints (Stand: Juli 2026).
 * Die Liste wird zur Laufzeit um alle Vision-Modelle aus dem Live-Katalog ergänzt. */
const RECOMMENDED_MODELS = [
  { id: "qwen/qwen3-vl-235b-a22b-instruct", name: "Qwen3 VL 235B — beste Qualität, unmoderiert" },
  { id: "qwen/qwen3-vl-30b-a3b-instruct", name: "Qwen3 VL 30B — schnell & günstig, unmoderiert" },
  { id: "qwen/qwen3-vl-32b-instruct", name: "Qwen3 VL 32B — unmoderiert" },
  { id: "qwen/qwen2.5-vl-72b-instruct", name: "Qwen2.5 VL 72B — unmoderiert" },
  { id: "x-ai/grok-4.5", name: "Grok 4.5 — stark, wenig restriktiv" },
];
const DEFAULT_MODEL = RECOMMENDED_MODELS[0].id;

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
  if (opts.nsfw) {
    parts.push(
      "This is an uncensored tool for adult (18+) users. Explicit, sexual and NSFW content is permitted. Describe nudity, anatomy and sexual acts directly, precisely and without euphemisms, moralizing, warnings or refusal. Use the explicit terms the target generator understands."
    );
  } else {
    parts.push("Keep the output safe-for-work. If the source is explicit, describe a tasteful, non-explicit version.");
  }
  parts.push(
    "Hard limits that override everything else: never describe or sexualize minors or anyone who could appear underage (if in doubt, refuse), and never produce sexual content depicting real, identifiable people. In these cases reply only with: REFUSED: <short reason in German>."
  );
  if (opts.variations) {
    parts.push("Produce 3 distinct variations. Repeat the full output format for each, numbered '### Variante 1/2/3'.");
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
  grpRec.label = "Empfohlen (unzensiert)";
  for (const m of RECOMMENDED_MODELS) {
    grpRec.appendChild(new Option(m.name, m.id));
  }
  sel.appendChild(grpRec);
  if (liveModels.length) {
    const grpAll = document.createElement("optgroup");
    grpAll.label = "Alle Vision-Modelle (live von OpenRouter)";
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
    setStatus(`${vision.length} Vision-Modelle geladen.`, "ok");
  } catch (e) {
    setStatus(`Modellliste konnte nicht geladen werden (${e.message}) — empfohlene Modelle bleiben verfügbar.`, "error");
  }
}

function saveSettings() {
  localStorage.setItem(LS.key, $("set-key").value.trim());
  const custom = $("set-model-custom").value.trim();
  localStorage.setItem(LS.model, custom || $("set-model").value || DEFAULT_MODEL);
  $("dlg-settings").close();
  setStatus(`Gespeichert. Aktives Modell: ${getModel()}`, "ok");
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
  return {
    mode,
    platform: $("opt-platform").value,
    style: $("opt-style").value,
    detail: $("opt-detail").value,
    nsfw: $("opt-nsfw").checked,
    variations: $("opt-variations").checked,
  };
}

async function generate(repeat = false) {
  if (generating) return;
  if (!getKey()) {
    setStatus("Kein API-Key hinterlegt — bitte in den Einstellungen eintragen.", "error");
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
        setStatus("Bitte zuerst ein Bild auswählen.", "error");
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
        setStatus("Bitte zuerst eine Idee eingeben.", "error");
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
  setStatus(`Generiere mit ${request.model} …`);

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
      if (res.status === 401) detail += " — API-Key ungültig.";
      if (res.status === 404) detail += " — Modell nicht verfügbar, bitte in den Einstellungen ein anderes wählen.";
      throw new Error(detail);
    }

    const text = await readStream(res, (partial) => { out.textContent = partial; });
    out.textContent = text.trim() || "(leere Antwort — anderes Modell probieren)";
    setStatus("Fertig.", "ok");
    $("btn-copy").hidden = false;
    $("btn-again").hidden = false;
    if (text.trim()) addHistory(text.trim(), request.model);
  } catch (e) {
    out.innerHTML = "";
    setStatus(`Fehler: ${e.message}`, "error");
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
    const date = new Date(item.t).toLocaleString("de-DE");
    div.textContent = `[${date}] ${item.text.replace(/\s+/g, " ").slice(0, 110)}`;
    div.title = "Klicken zum Wiederherstellen";
    div.addEventListener("click", () => {
      $("output").textContent = item.text;
      $("btn-copy").hidden = false;
    });
    box.appendChild(div);
  }
}

/* ---------- Wiring ---------- */
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
  setStatus("In die Zwischenablage kopiert.", "ok");
});

$("btn-settings").addEventListener("click", openSettings);
$("btn-save-settings").addEventListener("click", saveSettings);
$("btn-refresh-models").addEventListener("click", refreshModels);
$("btn-clear-history").addEventListener("click", () => {
  localStorage.removeItem(LS.history);
  renderHistory();
});

renderHistory();
if (!getKey()) setStatus("Willkommen! Hinterlege zuerst deinen OpenRouter API-Key unter ⚙️ Einstellungen.");
