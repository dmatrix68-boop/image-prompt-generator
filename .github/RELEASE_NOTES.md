**The Prompt Engine — Uncensored v1.1** now runs on two freely switchable providers: **OpenRouter** in the cloud, or **Ollama** entirely on your own machine.

## New in v1.1

- **Ollama support**: switch between ☁️ OpenRouter and 🖥️ Ollama directly in the header — no API key, no per-request cost, and no image ever leaves your computer. Model, API key and Ollama address are stored per provider, so switching back and forth never loses a setting.
- **Local model list** read from Ollama's `/api/tags`, split into installed models with image support, installed text-only models, and recommended ones that still need an `ollama pull` — each labelled with parameter size and disk size.
- **Actionable errors**: connection failures point at `ollama serve` / `OLLAMA_ORIGINS`, and a missing model names the exact `ollama pull` command to run.
- **Settings dialog** shows status messages inline instead of hiding them behind the modal backdrop.
- **Fix**: rows marked `hidden` stayed visible because a stylesheet rule outranked the browser's `[hidden]` default.
- Both READMEs document the Ollama setup, including `OLLAMA_ORIGINS`, `OLLAMA_CONTEXT_LENGTH` and the mixed-content caveat when serving the page over https.

## What it is

A static, backend-free rebuild of thepromptengine.midnightlabai.com that talks directly to the provider of your choice — no hardcoded model, so it cannot break the way the original did when its model was retired.

- **Image → Prompt**: upload via drag & drop, click, or Ctrl+V; a vision LLM reverse-engineers a generation prompt from the image
- **Idea → Prompt**: expands a short idea into a professional prompt
- **10 target platforms**: SDXL, Pony/Illustrious, Flux, Midjourney, DALL-E, Ideogram, Nano Banana/Gemini, Qwen-Image, Krea 2, universal — each with a platform-specific output format
- **Aspect ratios** (Auto, 1:1, 16:9, 9:16, 4:3, 3:2) and collapsible **technical parameters** (Logic Mode, camera angle, shot type, perspective, composition, lighting, atmosphere, mood, emotion) mirroring the original Midnight LAB v2.0 UI
- **Free model choice**: live model list from the OpenRouter catalog or from your local Ollama install, with a custom model ID fallback
- **Uncensored**: NSFW toggle with unmoderated default models (Qwen3-VL family in the cloud, qwen2.5vl/LLaVA locally); hard limits against illegal content always active
- **Bilingual UI** (DE/EN), streaming output, 3-variation mode, local history

## Usage

Serve the repo with any static file server, then pick a provider in the top-right header:

- **OpenRouter**: add your [API key](https://openrouter.ai/keys) under ⚙️ Settings and choose a vision model.
- **Ollama**: run `ollama pull qwen2.5vl:7b`, start Ollama with `OLLAMA_ORIGINS='*' OLLAMA_CONTEXT_LENGTH=8192 ollama serve`, then switch to 🖥️ Ollama.

See the [README](README.md) for details.
