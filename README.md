# ⚡ The Prompt Engine — Uncensored (OpenRouter & Ollama Edition)

*[Deutsche Version](README.de.md)*

Functional rebuild of *thepromptengine.midnightlabai.com* — without its fatal flaw:
the original hardcoded `gemini-2.5-flash` in its frontend bundle; after Google retired
that model for new API accounts, every new key ran into a 404.

This clone uses **freely selectable vision models** instead — no model is hardcoded,
and the model list is loaded at runtime. Switchable between two providers:

- **OpenRouter** (cloud) — huge model catalog, API key required, costs per request.
- **Ollama** (local) — runs on your own machine: no API key, no cost, and no image
  ever leaves your computer.

The switch sits in the top-right header (☁️ OpenRouter / 🖥️ Ollama) and in
⚙️ Settings. Model, API key, and Ollama address are stored per provider, so
switching back and forth never loses a setting.

## Features

- **Image → Prompt**: Upload an image (drag & drop, click, or Ctrl+V); a vision LLM
  analyzes it and produces a detailed generation prompt.
- **Idea → Prompt**: Enter a short idea and the engine expands it into a professional
  prompt.
- **Target platforms**: SDXL (tags + negative prompt), Pony/Illustrious (booru tags
  incl. score/rating tags), Flux (prose), Midjourney (incl. `--ar`/`--stylize`),
  DALL-E, Ideogram, Nano Banana/Gemini, Qwen-Image (with text rendering), Krea 2
  (photorealistic), universal.
- **Image formats**: Aspect-ratio selection as in the original (Auto, 1:1, 16:9, 9:16,
  4:3, 3:2) — emitted as `--ar` for Midjourney, with a matching resolution
  recommendation for SDXL/Pony.
- **Technical parameters** (as in the original, collapsible): Logic Mode, Camera Angle,
  Shot Type, Perspective, Composition, Lighting, Atmosphere, Mood, Emotion — each with
  the same value lists as Midnight LAB v2.0.
- **Bilingual**: Language switch (DE/EN) in the top right; the choice is remembered.
- **Options**: Style preset, detail level, 3-variation mode, streaming output, copy
  button, local history.
- **Uncensored**: NSFW toggle — explicit images are analyzed directly and without
  euphemisms. The recommended default models (Qwen3-VL family) run on unmoderated
  OpenRouter endpoints; running locally via Ollama, only the model itself decides.
  Hard limits always stay active: no depictions of minors, no sexual content
  involving real, identifiable people.
- **No backend**: Pure static frontend. The API key stays in the browser's
  localStorage and is sent exclusively and directly to `openrouter.ai` — or, with
  Ollama, to your own machine.

## Usage

1. Serve the page — locally, any static server will do:
   ```bash
   python3 -m http.server 8080
   # → http://localhost:8080
   ```
   Alternatively host it on GitHub Pages / Netlify / any web space.
2. Pick a provider in the top-right header and set it up under **⚙️ Settings**
   (see below).
3. Upload an image or enter an idea → **⚡ Generate prompt**.

### Option A: OpenRouter (cloud)

1. Create an API key at [openrouter.ai/keys](https://openrouter.ai/keys).
2. Enter the key under **⚙️ Settings** and pick a vision model.

### Option B: Ollama (local)

1. [Install Ollama](https://ollama.com/download) and pull a vision model:
   ```bash
   ollama pull qwen2.5vl:7b
   ```
2. Start Ollama so the browser is allowed to talk to it. Without
   `OLLAMA_ORIGINS`, Ollama's CORS check blocks requests coming from the page:
   ```bash
   # Linux / macOS
   OLLAMA_ORIGINS='*' OLLAMA_CONTEXT_LENGTH=8192 ollama serve
   ```
   ```powershell
   # Windows (PowerShell), then restart Ollama
   setx OLLAMA_ORIGINS "*"
   setx OLLAMA_CONTEXT_LENGTH "8192"
   ```
   Instead of `*` you can name the page's exact origin, e.g.
   `OLLAMA_ORIGINS='http://localhost:8080'`.
3. Switch to **🖥️ Ollama** in the header. **⚙️ Settings** holds the address
   (default `http://localhost:11434`); **🔄 Load model list** shows every installed
   model, split into "with image support" and "text only".

**Ollama notes**

- **Image → Prompt** needs a multimodal model (`qwen2.5vl`, `llava`, `minicpm-v`,
  `llama3.2-vision`, `gemma3`). Text-only models work in **Idea → Prompt** mode only.
- Keep `OLLAMA_CONTEXT_LENGTH` at 8192 or above: image tokens plus the long system
  prompt otherwise overflow the default context window and the start of the prompt
  gets truncated.
- If the page is served over **https**, browsers block calls to the
  `http://localhost` endpoint as mixed content. For Ollama, open the page locally
  over `http://localhost`.

## Model notes

- **OpenRouter**, for uncensored analysis: **Qwen3 VL 235B / 30B / 32B** or
  **Qwen2.5 VL 72B** (unmoderated endpoints, cheap). Grok is also fairly permissive.
- **Ollama**, local: **qwen2.5vl:7b** (~6 GB, fast, barely moderated),
  **qwen2.5vl:32b** (best quality, ~21 GB VRAM), **llava:13b**, **minicpm-v:8b**
  (lightweight). `llama3.2-vision` and `gemma3` work well but are noticeably more
  moderated.
- GPT, Claude, and Gemini models work for SFW content but usually refuse NSFW images.
- If a model ever becomes unavailable (the original's bug), just pick another one in
  the settings — or enter any model ID by hand.

## Legal

For adult users only. When using the cloud, the terms of use of OpenRouter and of
the respective model provider continue to apply and are the user's responsibility.
When running locally via Ollama, the licenses of the pulled models apply.
