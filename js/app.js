/* The Prompt Engine — Uncensored (OpenRouter / Ollama Edition)
 * Reines Frontend: API-Key, Einstellungen & Verlauf bleiben im Browser (localStorage).
 * Requests gehen direkt an den gewählten Anbieter — kein eigener Server nötig:
 *   • OpenRouter: Cloud, API-Key erforderlich (https://openrouter.ai)
 *   • Ollama:     lokal auf dem eigenen Rechner, kein API-Key, keine Kosten,
 *                 kein Datenabfluss (http://localhost:11434) */

"use strict";

const OR_BASE = "https://openrouter.ai/api/v1";
const OLLAMA_DEFAULT_URL = "http://localhost:11434";
const LS = {
  key: "pe_api_key",
  model: "pe_model",
  history: "pe_history",
  lang: "pe_lang",
  provider: "pe_provider",
  ollamaUrl: "pe_ollama_url",
  ollamaModel: "pe_ollama_model",
};

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

/* Empfohlene lokale Ollama-Modelle mit Bildverständnis. Müssen vorher per
 * `ollama pull <id>` geladen werden; die tatsächlich installierten Modelle
 * kommen zur Laufzeit aus /api/tags dazu. */
const RECOMMENDED_OLLAMA = [
  { id: "qwen2.5vl:7b", de: "Qwen2.5 VL 7B — schnell, kaum moderiert (~6 GB)", en: "Qwen2.5 VL 7B — fast, barely moderated (~6 GB)" },
  { id: "qwen2.5vl:32b", de: "Qwen2.5 VL 32B — beste Qualität (~21 GB VRAM)", en: "Qwen2.5 VL 32B — best quality (~21 GB VRAM)" },
  { id: "llava:13b", de: "LLaVA 13B — Klassiker, wenig restriktiv (~8 GB)", en: "LLaVA 13B — classic, few restrictions (~8 GB)" },
  { id: "minicpm-v:8b", de: "MiniCPM-V 8B — genügsam, gute Detailtreue (~5 GB)", en: "MiniCPM-V 8B — lightweight, good detail (~5 GB)" },
  { id: "llama3.2-vision:11b", de: "Llama 3.2 Vision 11B — solide, moderiert (~8 GB)", en: "Llama 3.2 Vision 11B — solid, moderated (~8 GB)" },
  { id: "gemma3:12b", de: "Gemma 3 12B — multimodal, moderiert (~8 GB)", en: "Gemma 3 12B — multimodal, moderated (~8 GB)" },
];
const DEFAULT_OLLAMA_MODEL = RECOMMENDED_OLLAMA[0].id;

/* ---------- i18n ----------
 * Deutsch ist die Basissprache und steht direkt im HTML; beim Start wird sie als
 * Snapshot gesichert. UI_EN enthält die englischen Texte für alle [data-i18n*]-
 * Elemente, MSG die dynamischen Meldungen in beiden Sprachen. */
let lang = localStorage.getItem(LS.lang) === "en" ? "en" : "de";

const UI_EN = {
  tagline: "Uncensored prompt generator · image, image edit & video · powered by OpenRouter or Ollama",
  settingsBtn: "⚙️ Settings",
  "tab.image": "🖼️ Image → Prompt",
  "tab.text": "💡 Idea → Prompt",
  "tab.edit": "🎨 Image → Image",
  "tab.video": "🎬 Image → Video",
  "drop.hint": "<strong>Drag an image here</strong>, click to select<br>or paste with <kbd>Ctrl</kbd>+<kbd>V</kbd>",
  "drop.hint.end": "<strong>Drag the end frame here</strong><br>last frame of the clip",
  "img.clear": "✕ Remove image",
  "img.clear.end": "✕ Remove",
  "img.extra.label": "Additional instruction (optional)",
  "img.extra.ph": "e.g. “focus on the lighting mood”, “describe as an anime version” …",
  "edit.desc.label": "Change description",
  "edit.desc.ph": "What should change in the image? e.g. “red leather jacket instead of the coat”, “swap the background for a city at night”, “remove the person” …",
  "edit.desc.small": "Describe the change only — the engine adds what has to stay untouched.",
  "video.desc.label": "Video description",
  "video.desc.ph": "What should happen in the clip? e.g. “slowly turns her head towards the camera, hair moving in the wind”, “camera travels down the alley” …",
  "video.desc.small": "The first image is the start frame. An optional end frame is analyzed as the target frame (the model has to handle two images).",
  "idea.label": "Your idea",
  "idea.ph": "Briefly describe what you want to generate — the engine turns it into a detailed professional prompt.",
  "opt.platform": "Target platform",
  "opt.scope": "Change scope",
  "opt.cammove": "Camera movement",
  "opt.motion": "Motion intensity",
  "opt.duration": "Clip length",
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
  "dlg.provider.label": "Provider",
  "prov.openrouter": "OpenRouter (cloud, API key required)",
  "prov.ollama": "Ollama (local, no API key)",
  "dlg.ollama.label": "Ollama address",
  "dlg.ollama.small": 'Ollama must be running (<code>ollama serve</code>) with a model pulled (<code>ollama pull qwen2.5vl:7b</code>). If this page is opened over <code>http://localhost</code>, nothing else is needed — <code>OLLAMA_ORIGINS</code> is only required for a different address.',
  "dlg.key.label": "OpenRouter API key",
  "dlg.key.small": 'Stored only locally in your browser (localStorage) and sent directly to openrouter.ai. Create a key: <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a>',
  "dlg.model.label": "Vision model",
  "dlg.custom.label": "Custom model ID (overrides selection, optional)",
  "dlg.refresh": "🔄 Load model list",
  "dlg.save": "Save",
  "dlg.legal": "For adult users only. No analysis of depictions of minors or non-consensual real content — such requests are refused. You are responsible for complying with your model provider's terms of use.",
};

const MSG = {
  de: {
    welcome: "Willkommen! Wähle unter ⚙️ Einstellungen einen Anbieter: OpenRouter (API-Key nötig) oder Ollama (lokal, ohne Key).",
    welcomeOllama: "Bereit — lokales Modell: {m}. Läuft Ollama nicht, in den Einstellungen die Modellliste laden.",
    noKey: "Kein API-Key hinterlegt — bitte in den Einstellungen eintragen.",
    noImage: "Bitte zuerst ein Bild auswählen.",
    noIdea: "Bitte zuerst eine Idee eingeben.",
    noSourceImage: "Bitte zuerst ein Quellbild auswählen.",
    noStartImage: "Bitte zuerst ein Startbild auswählen.",
    noEditDesc: "Bitte beschreiben, was am Bild geändert werden soll.",
    noVideoDesc: "Bitte beschreiben, was im Video passieren soll.",
    slotMain: "Bild",
    slotSource: "Quellbild",
    slotStart: "Startbild (erstes Frame)",
    slotEnd: "Endbild (optional)",
    generating: "Generiere mit {m} …",
    done: "Fertig.",
    copied: "In die Zwischenablage kopiert.",
    saved: "Gespeichert. Aktives Modell: {m}",
    modelsLoaded: "{n} Vision-Modelle geladen.",
    modelsError: "Modellliste konnte nicht geladen werden ({e}) — empfohlene Modelle bleiben verfügbar.",
    ollamaLoaded: "{n} lokale Modelle gefunden, davon {v} mit Bild-Unterstützung.",
    ollamaEmpty: "Ollama läuft, aber es ist noch kein Modell installiert — z.B. „ollama pull qwen2.5vl:7b“ ausführen.",
    ollamaError: "Ollama unter {u} nicht erreichbar ({e}). {h}",
    hintMixed: "Diese Seite läuft über https, Ollama aber nur über http — der Browser blockiert das als „Mixed Content“, noch bevor Ollama gefragt wird. Keine Ollama-Einstellung hilft dagegen: Seite lokal über http://localhost öffnen.",
    hintFile: "Diese Seite wurde direkt aus dem Dateisystem geöffnet (file://); der Browser sendet dann die Origin „null“, die Ollama ablehnt. Seite über einen lokalen Server ausliefern, z.B. „python3 -m http.server 8080“.",
    hintOrigin: "Diese Seite läuft unter {o}; Ollama erlaubt von sich aus nur localhost. Ollama mit OLLAMA_ORIGINS={o} starten — oder die Seite über http://localhost öffnen.",
    hintGeneric: "Läuft „ollama serve“? Blockieren evtl. Browser-Erweiterungen (Adblocker, Privacy-Tools) lokale Anfragen?",
    emptyResponse: "(leere Antwort — anderes Modell probieren)",
    error: "Fehler: {e}",
    err401: " — API-Key ungültig.",
    err404: " — Modell nicht verfügbar, bitte in den Einstellungen ein anderes wählen.",
    errOllama404: " — Modell nicht installiert. Zuerst „ollama pull {m}“ ausführen.",
    errOllamaNet: " — Ollama nicht erreichbar. {h}",
    historyRestore: "Klicken zum Wiederherstellen",
    techNone: "— (nicht vorgeben)",
    techDefault: "Default (Standard wählen)",
    grpRec: "Empfohlen (unzensiert)",
    grpAll: "Alle Vision-Modelle (live von OpenRouter)",
    switchedOllama: "Anbieter: Ollama (lokal) · Modell: {m}",
    switchedOR: "Anbieter: OpenRouter (Cloud) · Modell: {m}",
    customPhOR: "z.B. qwen/qwen3-vl-235b-a22b-instruct",
    customPhOllama: "z.B. qwen2.5vl:7b",
    grpRecOllama: "Empfohlen (ggf. erst per „ollama pull“ laden)",
    grpOllamaVision: "Installiert — mit Bild-Unterstützung",
    grpOllamaText: "Installiert — nur Text (für „Idee → Prompt“)",
    modelSmallOR: "Empfohlen für unzensierte Analyse: Qwen3-VL (unmoderierte Endpoints). Große Anbieter-Modelle (GPT, Claude, Gemini) verweigern NSFW-Bilder meist.",
    modelSmallOllama: "Für „Bild → Prompt“ ist ein Vision-Modell nötig (z.B. qwen2.5vl, llava, minicpm-v). Reine Text-Modelle funktionieren nur im Modus „Idee → Prompt“.",
  },
  en: {
    welcome: "Welcome! Pick a provider under ⚙️ Settings: OpenRouter (API key required) or Ollama (local, no key).",
    welcomeOllama: "Ready — local model: {m}. If Ollama isn't running, load the model list in the settings.",
    noKey: "No API key set — please add one in the settings.",
    noImage: "Please select an image first.",
    noIdea: "Please enter an idea first.",
    noSourceImage: "Please select a source image first.",
    noStartImage: "Please select a start image first.",
    noEditDesc: "Please describe what should change in the image.",
    noVideoDesc: "Please describe what should happen in the video.",
    slotMain: "Image",
    slotSource: "Source image",
    slotStart: "Start image (first frame)",
    slotEnd: "End frame (optional)",
    generating: "Generating with {m} …",
    done: "Done.",
    copied: "Copied to clipboard.",
    saved: "Saved. Active model: {m}",
    modelsLoaded: "{n} vision models loaded.",
    modelsError: "Could not load the model list ({e}) — the recommended models remain available.",
    ollamaLoaded: "Found {n} local models, {v} of them with image support.",
    ollamaEmpty: "Ollama is running but no model is installed yet — run e.g. “ollama pull qwen2.5vl:7b”.",
    ollamaError: "Ollama not reachable at {u} ({e}). {h}",
    hintMixed: "This page is served over https but Ollama only speaks http — the browser blocks that as mixed content before Ollama is ever asked. No Ollama setting fixes it: open the page locally over http://localhost.",
    hintFile: "This page was opened straight from the file system (file://); the browser then sends origin “null”, which Ollama rejects. Serve the page from a local server instead, e.g. “python3 -m http.server 8080”.",
    hintOrigin: "This page runs at {o}; Ollama only allows localhost by default. Start Ollama with OLLAMA_ORIGINS={o} — or open the page over http://localhost.",
    hintGeneric: "Is “ollama serve” running? Could a browser extension (ad blocker, privacy tool) be blocking local requests?",
    emptyResponse: "(empty response — try another model)",
    error: "Error: {e}",
    err401: " — invalid API key.",
    err404: " — model not available, please pick another one in the settings.",
    errOllama404: " — model not installed. Run “ollama pull {m}” first.",
    errOllamaNet: " — Ollama not reachable. {h}",
    historyRestore: "Click to restore",
    techNone: "— (unset)",
    techDefault: "Default (pick a standard)",
    grpRec: "Recommended (uncensored)",
    grpAll: "All vision models (live from OpenRouter)",
    switchedOllama: "Provider: Ollama (local) · model: {m}",
    switchedOR: "Provider: OpenRouter (cloud) · model: {m}",
    customPhOR: "e.g. qwen/qwen3-vl-235b-a22b-instruct",
    customPhOllama: "e.g. qwen2.5vl:7b",
    grpRecOllama: "Recommended (pull with “ollama pull” if missing)",
    grpOllamaVision: "Installed — with image support",
    grpOllamaText: "Installed — text only (for “Idea → Prompt”)",
    modelSmallOR: "Recommended for uncensored analysis: Qwen3-VL (unmoderated endpoints). Big-vendor models (GPT, Claude, Gemini) usually refuse NSFW images.",
    modelSmallOllama: "“Image → Prompt” needs a vision model (e.g. qwen2.5vl, llava, minicpm-v). Text-only models work in “Idea → Prompt” mode only.",
  },
};

function t(key, vars = {}) {
  let s = MSG[lang][key] ?? MSG.de[key] ?? key;
  // replaceAll: Platzhalter dürfen mehrfach vorkommen. Funktion als Ersatz, damit
  // "$"-Sequenzen im Wert (z.B. in einer Modell-ID) nicht als Muster gedeutet werden.
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, () => v);
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
  applyMode(mode);
  applyProviderUI();
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

  /* ----- Bild → Bild: Editoren nehmen eine Anweisung entgegen, kein Neu-Prompt.
   * Ausnahme SDXL img2img — dort gibt es keine Edit-Instruktion, sondern nur einen
   * vollständigen Prompt für das Zielbild plus Denoise-Stärke und Maske. ----- */
  "nano-edit": `Target: Nano Banana / Gemini image editing (instruction based).
Output ONE conversational natural-language editing instruction addressed to the model. Name the exact element to change and the desired result, and state explicitly what must stay identical (subject identity, pose, background, lighting, framing, style). No tag lists, no negative prompt, no parameters.
Format exactly:
PROMPT:
<edit instruction>`,
  "flux-kontext": `Target: Flux.1 Kontext (in-context image editing).
Output ONE imperative editing instruction, short and unambiguous ("Change X to Y", "Remove X", "Replace X with Y"). Kontext keeps untouched regions on its own, so describe ONLY the change plus the identity anchors that must be preserved ("keep the same face, pose, lighting and camera angle"). Do not re-describe the whole scene.
Format exactly:
PROMPT:
<edit instruction>`,
  "qwen-edit": `Target: Qwen-Image-Edit.
Output ONE precise natural-language editing instruction. Qwen-Image-Edit is strong at lettering and at localized edits: name the region or object to modify, the exact new content (put any text/lettering in double quotes) and what has to stay unchanged.
Format exactly:
PROMPT:
<edit instruction>`,
  "seededit": `Target: Seedream / SeedEdit.
Output ONE compact natural-language editing instruction of at most 60 words: the target object, the change, and the preservation constraints.
Format exactly:
PROMPT:
<edit instruction>`,
  "gpt-image-edit": `Target: GPT-Image / DALL-E edit.
Output ONE natural-language instruction that describes the resulting image after the change, phrased as a request to the model, plus an explicit list of what must remain unchanged.
Format exactly:
PROMPT:
<edit instruction>`,
  "sdxl-img2img": `Target: Stable Diffusion / SDXL img2img and inpainting.
img2img takes no edit instruction: output the FULL comma-separated tag prompt of the RESULTING image (the source scene with the requested change already applied), then a negative prompt, then a recommended denoising strength, then the region to mask for inpainting.
Format exactly:
PROMPT:
<positive prompt>
NEGATIVE:
<negative prompt>
DENOISE:
<value between 0.15 and 0.85, plus one short sentence why>
MASK:
<region to inpaint, or "—" for a full-image img2img pass>`,
  "generic-edit": `Target: a general-purpose AI image editor.
Output ONE clear natural-language editing instruction (what to change, exactly how, and what must stay untouched), then a full description of the intended result image for editors that need a complete prompt instead of an instruction.
Format exactly:
PROMPT:
<edit instruction>
RESULT:
<full description of the edited image>`,

  /* ----- Bild → Video: Startframe steht schon im Bild, gefragt ist Bewegung. ----- */
  kling: `Target: Kling (image-to-video).
The attached image is the first frame. Output ONE flowing natural-language video prompt describing, in this order: what the subject does, how the scene evolves, and the camera work. Present tense, under 150 words, no shot lists, no timestamps.
Then a short negative prompt of artifacts to avoid.
Format exactly:
PROMPT:
<video prompt>
NEGATIVE:
<negative prompt>`,
  runway: `Target: Runway Gen-4 (image-to-video).
Runway wants motion, not scene description — the image already defines the scene. Output ONE concise prompt of at most 60 words covering only the subject motion and the camera move, in simple direct language. No negative prompt.
Format exactly:
PROMPT:
<motion prompt>`,
  veo: `Target: Google Veo 3 (image-to-video with native audio).
Output ONE cinematic natural-language prompt covering subject action, how the environment changes, camera movement and lighting. Then a separate audio description (ambience, sound effects, and any dialogue in double quotes).
Format exactly:
PROMPT:
<video prompt>
AUDIO:
<sound design / dialogue>`,
  hailuo: `Target: Hailuo / MiniMax (image-to-video).
Output ONE short action-focused prompt of at most 80 words: subject motion first, then the camera movement in Hailuo's bracket syntax where it fits (e.g. [Push in], [Pan left], [Tracking shot]).
Format exactly:
PROMPT:
<video prompt>`,
  luma: `Target: Luma Dream Machine / Ray (image-to-video, keyframes).
Output ONE concise natural-language prompt describing the motion that plays out from the given keyframe(s) plus the camera move. Keep it physically plausible.
Format exactly:
PROMPT:
<video prompt>`,
  wan: `Target: Wan 2.2 (open-source image-to-video).
Output ONE detailed natural-language video prompt (subject motion, scene dynamics, camera, lighting, style), then a negative prompt with the usual artifact terms plus anything specific to avoid here.
Format exactly:
PROMPT:
<video prompt>
NEGATIVE:
<negative prompt>`,
  sora: `Target: Sora 2 (image-to-video).
Output ONE descriptive prompt written like a screenplay shot description: subject action, environment, camera, lighting and mood in flowing prose. Then a separate audio line for ambience and dialogue.
Format exactly:
PROMPT:
<video prompt>
AUDIO:
<sound design / dialogue>`,
  seedance: `Target: Seedance (image-to-video).
Output ONE compact prompt of at most 80 words as comma-separated clauses: subject action, then camera movement, then atmosphere.
Format exactly:
PROMPT:
<video prompt>`,
  "generic-video": `Target: a general-purpose image-to-video generator.
Output ONE natural-language video prompt covering subject motion, scene dynamics, camera movement, lighting and mood, followed by a short negative prompt.
Format exactly:
PROMPT:
<video prompt>
NEGATIVE:
<negative prompt>`,
};

/* Auswahllisten der Ziel-Plattform je Modus-Gruppe. Die Modi „Bild → Prompt“ und
 * „Idee → Prompt“ erzeugen ein Bild von Grund auf (create), „Bild → Bild“ bearbeitet
 * ein vorhandenes (edit), „Bild → Video“ animiert es (video). */
const PLATFORMS = {
  create: [
    { id: "sdxl", de: "Stable Diffusion / SDXL (Tags + Negative)", en: "Stable Diffusion / SDXL (tags + negative)" },
    { id: "pony", de: "Pony / Illustrious (Booru-Tags)", en: "Pony / Illustrious (booru tags)" },
    { id: "flux", de: "Flux (natürliche Sprache)", en: "Flux (natural language)" },
    { id: "midjourney", de: "Midjourney (mit --Parametern)", en: "Midjourney (with --parameters)" },
    { id: "dalle", de: "DALL-E (natürliche Sprache)", en: "DALL-E (natural language)" },
    { id: "ideogram", de: "Ideogram (natürliche Sprache, Text-Rendering)", en: "Ideogram (natural language, text rendering)" },
    { id: "nano", de: "Nano Banana / Gemini (natürliche Sprache)", en: "Nano Banana / Gemini (natural language)" },
    { id: "qwen-image", de: "Qwen-Image (natürliche Sprache, Text-Rendering)", en: "Qwen-Image (natural language, text rendering)" },
    { id: "krea2", de: "Krea 2 (fotorealistisch, natürliche Sprache)", en: "Krea 2 (photorealistic, natural language)" },
    { id: "generic", de: "Universell / andere Generatoren", en: "Universal / other generators" },
  ],
  edit: [
    { id: "nano-edit", de: "Nano Banana / Gemini (Bildbearbeitung)", en: "Nano Banana / Gemini (image editing)" },
    { id: "flux-kontext", de: "Flux.1 Kontext (Edit-Anweisung)", en: "Flux.1 Kontext (edit instruction)" },
    { id: "qwen-edit", de: "Qwen-Image-Edit (auch Text im Bild)", en: "Qwen-Image-Edit (incl. text in image)" },
    { id: "seededit", de: "Seedream / SeedEdit (kompakt)", en: "Seedream / SeedEdit (compact)" },
    { id: "gpt-image-edit", de: "GPT-Image / DALL-E Edit", en: "GPT-Image / DALL-E edit" },
    { id: "sdxl-img2img", de: "SD / SDXL img2img + Inpainting (mit Denoise & Maske)", en: "SD / SDXL img2img + inpainting (with denoise & mask)" },
    { id: "generic-edit", de: "Universell / andere Bildeditoren", en: "Universal / other image editors" },
  ],
  video: [
    { id: "kling", de: "Kling (Bild → Video)", en: "Kling (image-to-video)" },
    { id: "runway", de: "Runway Gen-4 (nur Bewegung, kurz)", en: "Runway Gen-4 (motion only, short)" },
    { id: "veo", de: "Google Veo 3 (mit Ton-Beschreibung)", en: "Google Veo 3 (with audio description)" },
    { id: "hailuo", de: "Hailuo / MiniMax (Bewegung + [Kamera])", en: "Hailuo / MiniMax (motion + [camera])" },
    { id: "luma", de: "Luma Dream Machine / Ray (Keyframes)", en: "Luma Dream Machine / Ray (keyframes)" },
    { id: "wan", de: "Wan 2.2 (Open Source, mit Negative)", en: "Wan 2.2 (open source, with negative)" },
    { id: "sora", de: "Sora 2 (Prosa + Ton)", en: "Sora 2 (prose + audio)" },
    { id: "seedance", de: "Seedance (kompakt)", en: "Seedance (compact)" },
    { id: "generic-video", de: "Universell / andere Videogeneratoren", en: "Universal / other video generators" },
  ],
};

/* Welche Plattform-Gruppe gehört zu welchem Modus. */
const MODE_GROUP = { image: "create", text: "create", edit: "edit", video: "video" };

/* Zuletzt gewählte Plattform je Gruppe — ein Moduswechsel soll die Auswahl der
 * anderen Modi nicht überschreiben. */
const platformChoice = { create: "sdxl", edit: "nano-edit", video: "kling" };

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

/* ---------- Bild → Bild ---------- */

/* Wie weit darf der Editor vom Original abweichen? Der Umfang steht bewusst
 * getrennt von der Änderungsbeschreibung: dieselbe Änderung ist als chirurgischer
 * Eingriff oder als freie Neuinterpretation umsetzbar. */
const EDIT_SCOPES = [
  { id: "minimal", de: "Minimal (nur das Genannte, sonst identisch)", en: "Minimal (only what was asked, rest identical)" },
  { id: "moderate", de: "Moderat (Umgebung darf sich anpassen)", en: "Moderate (surroundings may adapt)" },
  { id: "strong", de: "Stark (freie Neuinterpretation)", en: "Strong (free reinterpretation)" },
];

const EDIT_SCOPE_HINTS = {
  minimal: "Edit scope: surgical. Change only what the user explicitly asked for; identity, pose, background, lighting, colors, framing and style must stay identical. State these preservation constraints explicitly in the prompt.",
  moderate: "Edit scope: moderate. Apply the requested change and adapt the directly affected areas (shadows, reflections, contact points, perspective) so the result stays coherent — but keep the overall composition, subject identity and style of the source.",
  strong: "Edit scope: free reinterpretation. The requested change may transform the whole image (style, lighting, environment); only the core subject identity and the essential composition have to stay recognizable.",
};

/* ---------- Bild → Video ---------- */

const CAMERA_MOVES = [
  { id: "", de: "Automatisch (passend zur Szene)", en: "Automatic (fitting the scene)" },
  { id: "static", de: "Statisch (feste Kamera)", en: "Static (locked-off camera)" },
  { id: "push-in", de: "Langsame Fahrt hinein (Dolly in)", en: "Slow push in (dolly in)" },
  { id: "pull-out", de: "Fahrt heraus (Dolly out)", en: "Pull out (dolly out)" },
  { id: "pan-left", de: "Schwenk nach links", en: "Pan left" },
  { id: "pan-right", de: "Schwenk nach rechts", en: "Pan right" },
  { id: "tilt-up", de: "Neigen nach oben", en: "Tilt up" },
  { id: "tilt-down", de: "Neigen nach unten", en: "Tilt down" },
  { id: "orbit", de: "Umkreisen (Orbit / Arc)", en: "Orbit / arc around the subject" },
  { id: "crane", de: "Kranfahrt nach oben", en: "Crane up" },
  { id: "handheld", de: "Handkamera, folgt dem Motiv", en: "Handheld, following the subject" },
  { id: "tracking", de: "Mitfahrt (Tracking Shot)", en: "Tracking shot" },
  { id: "zoom-in", de: "Zoom hinein", en: "Zoom in" },
];

const CAMERA_MOVE_HINTS = {
  static: "the camera stays completely locked off",
  "push-in": "the camera slowly pushes in towards the subject (dolly in)",
  "pull-out": "the camera pulls back and reveals more of the scene (dolly out)",
  "pan-left": "the camera pans to the left",
  "pan-right": "the camera pans to the right",
  "tilt-up": "the camera tilts upwards",
  "tilt-down": "the camera tilts downwards",
  orbit: "the camera arcs around the subject in a smooth orbit",
  crane: "the camera cranes upwards, gaining height",
  handheld: "a handheld camera follows the subject with subtle natural shake",
  tracking: "the camera tracks alongside the moving subject",
  "zoom-in": "the lens zooms in on the subject",
};

const MOTION_LEVELS = [
  { id: "subtle", de: "Dezent (Cinemagraph, kaum Bewegung)", en: "Subtle (cinemagraph, barely any motion)" },
  { id: "moderate", de: "Moderat (klare, ruhige Bewegung)", en: "Moderate (clear, calm motion)" },
  { id: "dynamic", de: "Dynamisch (viel Action)", en: "Dynamic (lots of action)" },
];

const MOTION_HINTS = {
  subtle: "Motion intensity: subtle — only natural micro-movement (breathing, blinking, hair, fabric, drifting light or smoke); the frame stays very close to the source image.",
  moderate: "Motion intensity: moderate — clear but controlled movement of subject and camera, one single continuous action.",
  dynamic: "Motion intensity: dynamic — pronounced action and camera movement, while staying physically plausible and free of morphing artifacts.",
};

const DURATIONS = [
  { id: "auto", de: "Automatisch", en: "Automatic" },
  { id: "5s", de: "5 Sekunden", en: "5 seconds" },
  { id: "8s", de: "8 Sekunden", en: "8 seconds" },
  { id: "10s", de: "10 Sekunden", en: "10 seconds" },
];

/* Modusabhängige Rollenbeschreibung — sie legt fest, was das Modell mit dem
 * (ggf. angehängten) Bild überhaupt tun soll. */
const MODE_TASKS = {
  image: "Analyze the attached image completely and factually, then write a prompt that would recreate it as faithfully as possible.",
  text: "Expand the user's idea into a complete, professional generation prompt.",
  edit: "The attached image is the SOURCE image; the user states the change they want. Analyze the source precisely, then write an image-editing prompt that applies exactly that change to this very image and leaves everything else untouched. Never write a prompt that would generate a new image from scratch, and never invent changes the user did not ask for.",
  video: "The attached image is the FIRST FRAME of a video clip; the user states what should happen. Analyze the frame precisely, then write an image-to-video prompt that animates exactly this frame. Describe motion over time — subject action, scene dynamics and camera work — not the static content of the frame, which the video model already has.",
};

function buildSystemPrompt(opts) {
  const parts = [
    "You are The Prompt Engine, an elite prompt engineer for AI image, image-editing and video generators. You convert images or ideas into production-ready generation prompts.",
    MODE_TASKS[opts.mode],
  ];

  if (opts.mode === "video" && opts.endImage) {
    parts.push(
      "A SECOND image is attached: it is the target LAST frame of the clip. Describe the motion as one continuous transition from the first frame into that last frame — name which elements move, how they move, and how they end up matching the final frame. Do not describe the two frames as separate shots; there is no cut."
    );
  }

  parts.push(PLATFORM_SPECS[opts.platform]);

  /* Im Edit-Modus heißt „Automatisch“ nicht „Stil ableiten“, sondern „Stil des
   * Originals erhalten“ — sonst schreibt das Modell den Look ungefragt um. */
  if (opts.mode === "edit" && opts.style === "auto") {
    parts.push("Preserve the original style, medium and look of the source image unless the requested change explicitly asks for a different one.");
  } else {
    parts.push(STYLE_HINTS[opts.style]);
  }
  parts.push(DETAIL_HINTS[opts.detail]);

  if (opts.mode === "edit") {
    parts.push(EDIT_SCOPE_HINTS[opts.editScope]);
  }

  if (opts.mode === "video") {
    parts.push(MOTION_HINTS[opts.motion]);
    if (opts.cameraMove) {
      parts.push(`Mandatory camera work: ${CAMERA_MOVE_HINTS[opts.cameraMove]}. Express it in the prompt using the wording the target platform understands.`);
    }
    if (opts.duration !== "auto") {
      parts.push(`Target clip length: ${opts.duration}. Pace the action so it starts and completes within that time — no more beats than actually fit.`);
    }
    parts.push("Keep the described motion physically plausible and continuous: one uninterrupted take, no cuts, no scene changes, no teleporting objects, and nothing that would force the model to morph or re-invent the subject.");
  }

  // Bildformat — im Edit-Modus gibt das Quellbild das Format vor.
  if (opts.mode === "edit") {
    parts.push("Keep the aspect ratio and framing of the source image unless the requested change explicitly asks for a different crop or an outpainting.");
  } else if (opts.ratio && opts.ratio !== "auto") {
    if (opts.platform === "midjourney") {
      parts.push(`Mandatory aspect ratio: end the prompt with --ar ${opts.ratio}.`);
    } else if (opts.platform === "sdxl" || opts.platform === "pony") {
      parts.push(`Mandatory aspect ratio ${opts.ratio}: compose the scene for this format and append a final line "RESOLUTION: ${SDXL_RES[opts.ratio]}".`);
    } else {
      parts.push(`Mandatory aspect ratio ${opts.ratio}: compose the scene for this format and state the orientation/framing in the prompt.`);
    }
  } else if (opts.mode === "image" || opts.mode === "video") {
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
let lastRequest = null;
let generating = false;

/* ---------- Anbieter & Settings ----------
 * OpenRouter und Ollama sprechen beide dasselbe OpenAI-kompatible
 * /chat/completions-Protokoll (Ollama stellt es unter /v1 bereit), inklusive
 * Bildern als data:-URL und SSE-Streaming — der Generierungspfad bleibt daher
 * für beide identisch, nur Basis-URL, Auth und Modellliste unterscheiden sich. */
function getProvider() { return localStorage.getItem(LS.provider) === "ollama" ? "ollama" : "openrouter"; }
function isOllama() { return getProvider() === "ollama"; }
function getKey() { return localStorage.getItem(LS.key) || ""; }

function normalizeUrl(u) {
  const v = (u || "").trim().replace(/\/+$/, "");
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `http://${v}`;
}

function getOllamaUrl() { return normalizeUrl(localStorage.getItem(LS.ollamaUrl)) || OLLAMA_DEFAULT_URL; }

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"];

/* Ollama erlaubt localhost/127.0.0.1/0.0.0.0 auf jedem Port bereits ab Werk
 * (envconfig.AllowedOrigins). Ein fehlgeschlagener Zugriff hat deshalb fast immer
 * eine Ursache im Kontext der Seite, nicht in Ollamas Konfiguration — und die lässt
 * sich hier benennen, statt pauschal OLLAMA_ORIGINS zu empfehlen. */
function ollamaHint(url) {
  if (location.protocol === "file:") return t("hintFile");
  if (location.protocol === "https:" && /^http:\/\//i.test(url)) return t("hintMixed");
  if (!LOCAL_HOSTS.includes(location.hostname)) return t("hintOrigin", { o: location.origin });
  return t("hintGeneric");
}

function modelFor(provider) {
  return provider === "ollama"
    ? localStorage.getItem(LS.ollamaModel) || DEFAULT_OLLAMA_MODEL
    : localStorage.getItem(LS.model) || DEFAULT_MODEL;
}
function getModel() { return modelFor(getProvider()); }
function apiBase() { return isOllama() ? `${getOllamaUrl()}/v1` : OR_BASE; }

/* Solange der Dialog offen ist, zählt die (noch ungespeicherte) Auswahl darin. */
function uiProvider() {
  return $("dlg-settings").open ? ($("set-provider").value === "ollama" ? "ollama" : "openrouter") : getProvider();
}
function uiOllamaUrl() {
  return ($("dlg-settings").open && normalizeUrl($("set-ollama-url").value)) || getOllamaUrl();
}

function applyProviderUI() {
  const ollama = uiProvider() === "ollama";
  $("row-key").hidden = ollama;
  $("row-ollama").hidden = !ollama;
  $("set-model-small").textContent = t(ollama ? "modelSmallOllama" : "modelSmallOR");
  $("set-model-custom").placeholder = t(ollama ? "customPhOllama" : "customPhOR");
}

/* Kopfzeilen-Umschalter: markiert den aktiven Anbieter. */
function updateProviderSwitch() {
  const p = getProvider();
  document.querySelectorAll("#provider-switch button").forEach((b) => {
    b.classList.toggle("active", b.dataset.provider === p);
  });
}

/* Direktes Umschalten aus der Kopfzeile — Modell, Key und Ollama-Adresse
 * bleiben je Anbieter getrennt gespeichert, ein Wechsel verliert also nichts. */
function setProvider(provider) {
  if (provider === getProvider()) return;
  localStorage.setItem(LS.provider, provider === "ollama" ? "ollama" : "openrouter");
  $("set-provider").value = getProvider();
  updateProviderSwitch();
  applyProviderUI();
  lastRequest = null;
  if (isOllama()) setStatus(t("switchedOllama", { m: getModel() }), "ok");
  else if (!getKey()) { setStatus(t("noKey"), "error"); openSettings(); return; }
  else setStatus(t("switchedOR", { m: getModel() }), "ok");
}

function openSettings() {
  $("set-provider").value = getProvider();
  $("set-key").value = getKey();
  $("set-ollama-url").value = getOllamaUrl();
  $("dlg-settings").showModal();
  applyProviderUI();
  populateModelSelect([recommendedGroup()]);
  refreshModels();
}

function recommendedGroup() {
  const ollama = uiProvider() === "ollama";
  const list = ollama ? RECOMMENDED_OLLAMA : RECOMMENDED_MODELS;
  return { label: t(ollama ? "grpRecOllama" : "grpRec"), items: list.map((m) => ({ id: m.id, name: m[lang] })) };
}

/* groups: [{ label, items: [{ id, name }] }] — leere Gruppen entfallen, Duplikate
 * werden übersprungen. Passt das aktive Modell zu keinem Eintrag, landet es im
 * Feld für die eigene Modell-ID. */
function populateModelSelect(groups) {
  const sel = $("set-model");
  const current = modelFor(uiProvider());
  const seen = new Set();
  sel.innerHTML = "";
  for (const g of groups) {
    const items = g.items.filter((it) => {
      if (seen.has(it.id)) return false;
      seen.add(it.id);
      return true;
    });
    if (!items.length) continue;
    const og = document.createElement("optgroup");
    og.label = g.label;
    for (const it of items) og.appendChild(new Option(it.name, it.id));
    sel.appendChild(og);
  }
  if ([...sel.options].some((o) => o.value === current)) {
    sel.value = current;
    $("set-model-custom").value = "";
  } else {
    $("set-model-custom").value = current;
  }
}

async function refreshModels() {
  const ollama = uiProvider() === "ollama";
  try {
    if (ollama) await refreshOllamaModels();
    else await refreshOpenRouterModels();
  } catch (e) {
    populateModelSelect([recommendedGroup()]);
    const url = uiOllamaUrl();
    setStatus(ollama ? t("ollamaError", { u: url, e: e.message, h: ollamaHint(url) }) : t("modelsError", { e: e.message }), "error");
  }
}

async function refreshOpenRouterModels() {
  const res = await fetch(`${OR_BASE}/models`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { data } = await res.json();
  const vision = data
    .filter((m) => (m.architecture?.input_modalities || []).includes("image"))
    .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
    .map((m) => ({ id: m.id, name: m.name || m.id }));
  populateModelSelect([recommendedGroup(), { label: t("grpAll"), items: vision }]);
  setStatus(t("modelsLoaded", { n: vision.length }), "ok");
}

/* Heuristik: Ollama meldet keine Modalitäten, aber multimodale Modelle bringen
 * einen Bild-Encoder mit, der in details.families auftaucht (clip, mllama, …). */
const VISION_HINT = /clip|vision|mllama|llava|minicpm-?v|moondream|qwen[0-9.]*-?vl|vl$/i;

function ollamaHasVision(m) {
  const fams = [m.details?.family, ...(m.details?.families || [])].filter(Boolean);
  return fams.some((f) => VISION_HINT.test(f)) || VISION_HINT.test((m.name || "").split(":")[0]);
}

function ollamaLabel(m) {
  const bits = [m.details?.parameter_size, m.size ? `${(m.size / 1e9).toFixed(1)} GB` : null].filter(Boolean);
  return bits.length ? `${m.name} — ${bits.join(", ")}` : m.name;
}

async function refreshOllamaModels() {
  const res = await fetch(`${uiOllamaUrl()}/api/tags`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { models = [] } = await res.json();
  const vision = [];
  const textOnly = [];
  for (const m of [...models].sort((a, b) => a.name.localeCompare(b.name))) {
    (ollamaHasVision(m) ? vision : textOnly).push({ id: m.name, name: ollamaLabel(m) });
  }
  populateModelSelect([
    { label: t("grpOllamaVision"), items: vision },
    { label: t("grpOllamaText"), items: textOnly },
    recommendedGroup(),
  ]);
  if (models.length) setStatus(t("ollamaLoaded", { n: models.length, v: vision.length }), "ok");
  else setStatus(t("ollamaEmpty"), "error");
}

function saveSettings() {
  const provider = $("set-provider").value === "ollama" ? "ollama" : "openrouter";
  const chosen = $("set-model-custom").value.trim() || $("set-model").value;
  localStorage.setItem(LS.provider, provider);
  localStorage.setItem(LS.key, $("set-key").value.trim());
  localStorage.setItem(LS.ollamaUrl, normalizeUrl($("set-ollama-url").value) || OLLAMA_DEFAULT_URL);
  if (provider === "ollama") localStorage.setItem(LS.ollamaModel, chosen || DEFAULT_OLLAMA_MODEL);
  else localStorage.setItem(LS.model, chosen || DEFAULT_MODEL);
  $("dlg-settings").close();
  applyProviderUI();
  updateProviderSwitch();
  lastRequest = null;
  setStatus(t("saved", { m: getModel() }), "ok");
}

/* ---------- Image handling ----------
 * Zwei Bildplätze mit identischem Verhalten: der Hauptplatz trägt je nach Modus
 * das Bild, das Quell- oder das Startbild; der zweite nur in „Bild → Video“ das
 * optionale Endframe. */
const MAX_DIM = 1792;

function createImageSlot({ zone, input, hint, preview, clear }) {
  const dz = $(zone);
  const fileInput = $(input);
  const slot = { dataUrl: null };

  function show(dataUrl) {
    slot.dataUrl = dataUrl;
    $(preview).src = dataUrl;
    $(preview).hidden = false;
    $(hint).hidden = true;
    $(clear).hidden = false;
  }

  slot.clear = () => {
    slot.dataUrl = null;
    $(preview).hidden = true;
    $(preview).src = "";
    $(hint).hidden = false;
    $(clear).hidden = true;
    fileInput.value = "";
  };

  /* Große Bilder kosten nur Tokens und sprengen bei Ollama schnell das
   * Kontextfenster — vor dem Versand auf MAX_DIM herunterrechnen. */
  slot.load = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (Math.max(w, h) <= MAX_DIM) {
          show(reader.result);
          return;
        }
        const f = MAX_DIM / Math.max(w, h);
        w = Math.round(w * f);
        h = Math.round(h * f);
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        show(c.toDataURL("image/jpeg", 0.92));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  dz.addEventListener("click", (e) => { if (e.target.id !== clear) fileInput.click(); });
  fileInput.addEventListener("change", (e) => slot.load(e.target.files[0]));
  dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("drag"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("drag"));
  dz.addEventListener("drop", (e) => {
    e.preventDefault();
    dz.classList.remove("drag");
    slot.load(e.dataTransfer.files[0]);
  });
  $(clear).addEventListener("click", slot.clear);
  return slot;
}

const mainImage = createImageSlot({
  zone: "dropzone", input: "file-input", hint: "drop-hint", preview: "preview", clear: "btn-clear-img",
});
const endImage = createImageSlot({
  zone: "dropzone-end", input: "file-input-end", hint: "drop-hint-end", preview: "preview-end", clear: "btn-clear-img-end",
});

/* ---------- Generation ---------- */
function setStatus(msg, cls = "") {
  const el = $("status");
  el.textContent = msg;
  el.className = `status ${cls}`;
  /* Bei offenem Dialog liegt die Statuszeile hinter dem Overlay — dort spiegeln,
   * damit Meldungen zur Modellliste (z.B. Ollama nicht erreichbar) sichtbar sind. */
  const inDlg = $("dlg-status");
  inDlg.textContent = $("dlg-settings").open ? msg : "";
  inDlg.className = `status ${cls}`;
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
    editScope: $("opt-edit-scope").value,
    cameraMove: $("opt-camera-move").value,
    motion: $("opt-motion").value,
    duration: $("opt-duration").value,
    endImage: mode === "video" && !!endImage.dataUrl,
    tech,
    logic: $("opt-logic").checked,
    nsfw: $("opt-nsfw").checked,
    variations: $("opt-variations").checked,
  };
}

/* Baut den Nutzer-Teil der Anfrage. Bilder gehen als data:-URL mit; im Video-Modus
 * kommt vor dem zweiten Bild eine Zeile, die es als Ziel-Endframe kennzeichnet —
 * ohne sie wäre für das Modell nicht erkennbar, welches Bild welche Rolle hat.
 * Gibt null zurück (und setzt den Status), wenn eine Pflichtangabe fehlt. */
function buildUserContent() {
  const content = [];
  if (mode === "text") {
    const idea = $("text-idea").value.trim();
    if (!idea) return fail("noIdea");
    content.push({ type: "text", text: `Idea: ${idea}` });
    return content;
  }

  if (mode === "image") {
    if (!mainImage.dataUrl) return fail("noImage");
    const extra = $("image-extra").value.trim();
    content.push({
      type: "text",
      text: "Analyze this image and generate the prompt." + (extra ? ` Additional instruction: ${extra}` : ""),
    });
    content.push({ type: "image_url", image_url: { url: mainImage.dataUrl } });
    return content;
  }

  if (mode === "edit") {
    if (!mainImage.dataUrl) return fail("noSourceImage");
    const desc = $("edit-desc").value.trim();
    if (!desc) return fail("noEditDesc");
    content.push({ type: "text", text: `This is the source image. Requested change: ${desc}` });
    content.push({ type: "image_url", image_url: { url: mainImage.dataUrl } });
    return content;
  }

  // mode === "video"
  if (!mainImage.dataUrl) return fail("noStartImage");
  const desc = $("video-desc").value.trim();
  if (!desc) return fail("noVideoDesc");
  content.push({ type: "text", text: `This is the first frame of the clip. Requested motion: ${desc}` });
  content.push({ type: "image_url", image_url: { url: mainImage.dataUrl } });
  if (endImage.dataUrl) {
    content.push({ type: "text", text: "This second image is the target last frame of the same clip:" });
    content.push({ type: "image_url", image_url: { url: endImage.dataUrl } });
  }
  return content;
}

function fail(msgKey) {
  setStatus(t(msgKey), "error");
  return null;
}

async function generate(repeat = false) {
  if (generating) return;
  if (!isOllama() && !getKey()) {
    setStatus(t("noKey"), "error");
    openSettings();
    return;
  }

  let request;
  if (repeat && lastRequest) {
    // Gleiche Anfrage, aber mit dem aktuell aktiven Modell (Anbieter kann inzwischen gewechselt sein).
    request = { ...lastRequest, model: getModel() };
    lastRequest = request;
  } else {
    const opts = collectOptions();
    const userContent = buildUserContent();
    if (!userContent) return;
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

  const ollama = isOllama();
  const headers = { "Content-Type": "application/json" };
  if (!ollama) {
    // Ollama läuft lokal und kennt keine Authentifizierung.
    headers.Authorization = `Bearer ${getKey()}`;
    headers["X-Title"] = "The Prompt Engine (Uncensored)";
  }

  try {
    let res;
    try {
      res = await fetch(`${apiBase()}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
      });
    } catch (netErr) {
      // Bei Ollama fast immer: Dienst läuft nicht oder CORS blockt den Browser.
      throw new Error(netErr.message + (ollama ? t("errOllamaNet", { h: ollamaHint(getOllamaUrl()) }) : ""));
    }

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        detail = err.error?.message || detail;
      } catch { /* leave detail */ }
      if (res.status === 401) detail += t("err401");
      if (res.status === 404) detail += ollama ? t("errOllama404", { m: request.model }) : t("err404");
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

/* ---------- Modus & dynamische Auswahllisten ----------
 * Plattform, Änderungsumfang, Kamerabewegung, Bewegungsintensität und Cliplänge
 * stehen zweisprachig in JS statt im HTML, weil sich ihre Inhalte je nach Modus
 * ändern — sie werden deshalb bei jedem Modus- und Sprachwechsel neu aufgebaut. */
function fillSelect(id, items, fallback) {
  const el = $(id);
  const keep = el.value;
  el.innerHTML = "";
  for (const it of items) el.appendChild(new Option(it[lang], it.id));
  el.value = items.some((it) => it.id === keep) ? keep : fallback;
}

function applyMode(m) {
  mode = m;
  const group = MODE_GROUP[mode];
  const isVideo = mode === "video";
  const isEdit = mode === "edit";

  document.querySelectorAll(".tab").forEach((tb) => tb.classList.toggle("active", tb.dataset.mode === mode));
  $("pane-image").hidden = mode === "text";
  $("pane-text").hidden = mode !== "text";

  $("slot-end").hidden = !isVideo;
  $("slot-label-main").textContent = t(isEdit ? "slotSource" : isVideo ? "slotStart" : "slotMain");
  $("slot-label-end").textContent = t("slotEnd");

  $("row-image-extra").hidden = mode !== "image";
  $("row-edit-desc").hidden = !isEdit;
  $("row-video-desc").hidden = !isVideo;

  $("row-edit-scope").hidden = !isEdit;
  $("row-camera-move").hidden = !isVideo;
  $("row-motion").hidden = !isVideo;
  $("row-duration").hidden = !isVideo;
  // Das Quellbild gibt das Format vor — im Edit-Modus gibt es nichts zu wählen.
  $("row-ratio").hidden = isEdit;

  fillSelect("opt-platform", PLATFORMS[group], platformChoice[group]);
  fillSelect("opt-edit-scope", EDIT_SCOPES, "minimal");
  fillSelect("opt-camera-move", CAMERA_MOVES, "");
  fillSelect("opt-motion", MOTION_LEVELS, "moderate");
  fillSelect("opt-duration", DURATIONS, "auto");
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
  tab.addEventListener("click", () => applyMode(tab.dataset.mode));
});

/* Eingefügte Bilder landen immer im Hauptplatz; aus dem reinen Textmodus heraus
 * wird dafür in „Bild → Prompt“ gewechselt. */
document.addEventListener("paste", (e) => {
  const file = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"))?.getAsFile();
  if (!file) return;
  if (mode === "text") applyMode("image");
  mainImage.load(file);
});

$("opt-platform").addEventListener("change", () => {
  platformChoice[MODE_GROUP[mode]] = $("opt-platform").value;
});

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

document.querySelectorAll("#provider-switch button").forEach((btn) => {
  btn.addEventListener("click", () => setProvider(btn.dataset.provider));
});

$("set-provider").addEventListener("change", () => {
  applyProviderUI();
  populateModelSelect([recommendedGroup()]);
  refreshModels();
});

$("btn-settings").addEventListener("click", openSettings);
$("btn-save-settings").addEventListener("click", saveSettings);
$("btn-refresh-models").addEventListener("click", refreshModels);
$("btn-clear-history").addEventListener("click", () => {
  localStorage.removeItem(LS.history);
  renderHistory();
});

initI18n();
$("set-provider").value = getProvider();
applyLanguage();
applyProviderUI();
updateProviderSwitch();
if (isOllama()) setStatus(t("welcomeOllama", { m: getModel() }));
else if (!getKey()) setStatus(t("welcome"));
