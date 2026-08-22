**The Prompt Engine — Uncensored v1.2** makes the local Ollama setup work on the first try: one double-click starts everything, and when something does go wrong the app names the actual reason.

## New in v1.2

- **One-click start**: `start.bat` (Windows) or `python3 serve.py` (macOS/Linux) serves the page from `http://127.0.0.1` and opens the browser. It runs in its own folder rather than wherever it was called from, so it cannot end up serving your home directory by mistake, and it tries several ports because Windows reserves whole ranges for Hyper-V/WSL — a port there refuses to bind even with nothing listening on it.
- **Ollama is started for you**: the launcher checks whether the Ollama server answers and runs `ollama serve` in the background if it doesn't, then reports the installed models. Never fatal — if Ollama is missing, the page still starts and works with OpenRouter. Skip the step with `--no-ollama`.
- **Errors that name the cause**: a failed Ollama connection is now diagnosed from the page's own context instead of pointing at a generic CORS setting — mixed content on an https page, origin `null` from a `file://` page, a foreign origin needing `OLLAMA_ORIGINS`, or simply a service that isn't running.
- **Corrected CORS guidance**: v1.1 told users to set `OLLAMA_ORIGINS=*`. That is unnecessary and the least safe option — Ollama already accepts `localhost`, `127.0.0.1` and `0.0.0.0` on any port out of the box. Both READMEs now lead with the localhost path and treat `OLLAMA_ORIGINS` as the exception it is.
- **Fix**: a message using the same placeholder twice only had its first occurrence substituted.

## What it is

A static, backend-free rebuild of thepromptengine.midnightlabai.com that talks directly to the provider of your choice — no hardcoded model, so it cannot break the way the original did when its model was retired.

- **Two providers, switchable in the header**: ☁️ OpenRouter in the cloud, or 🖥️ Ollama entirely on your own machine — no API key, no per-request cost, and no image ever leaves your computer. Model, API key and Ollama address are stored per provider.
- **Image → Prompt**: upload via drag & drop, click, or Ctrl+V; a vision LLM reverse-engineers a generation prompt from the image
- **Idea → Prompt**: expands a short idea into a professional prompt
- **10 target platforms**: SDXL, Pony/Illustrious, Flux, Midjourney, DALL-E, Ideogram, Nano Banana/Gemini, Qwen-Image, Krea 2, universal — each with a platform-specific output format
- **Aspect ratios** (Auto, 1:1, 16:9, 9:16, 4:3, 3:2) and collapsible **technical parameters** (Logic Mode, camera angle, shot type, perspective, composition, lighting, atmosphere, mood, emotion) mirroring the original Midnight LAB v2.0 UI
- **Uncensored**: NSFW toggle with unmoderated default models (Qwen3-VL family in the cloud, qwen2.5vl/LLaVA locally); hard limits against illegal content always active
- **Bilingual UI** (DE/EN), streaming output, 3-variation mode, local history

## Usage

Unpack the archive and start the page:

- **Windows**: double-click `start.bat`
- **macOS / Linux**: `python3 serve.py`

Then pick a provider in the top-right header:

- **Ollama** (local): `ollama pull qwen2.5vl:7b` once, and the launcher handles the rest.
- **OpenRouter** (cloud): add your [API key](https://openrouter.ai/keys) under ⚙️ Settings and choose a vision model.

For Ollama the page has to be served from `localhost` — hosting it on GitHub Pages works with OpenRouter only. See the [README](README.md) for details.
