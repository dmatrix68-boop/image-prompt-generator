**The Prompt Engine — Uncensored v1.4.0** adds Z-Image Turbo to the target platforms for image prompts.

## New in v1.4.0

- **Z-Image Turbo** joins the target platforms in *Image → Prompt* and *Idea → Prompt*. It is a distilled few-step model that runs without classifier-free guidance, which means a negative prompt has no effect on it — so this platform emits the positive prompt alone and has the engine write every constraint into it ("plain seamless background, no lettering" rather than a negative list). The prompt comes out as 80–250 words of structured natural language, ordered shot and subject, appearance, clothing, environment, lighting, mood, style. Generic quality tags like "masterpiece" or "8k" are left out on purpose: they do nothing for this model. Lettering is quoted, one language per text element, with its place in the image stated — Turbo renders English and Chinese text well.

That brings the image-prompt modes to eleven target platforms and the tool to 27 in total.

## What it is

A static, backend-free rebuild of thepromptengine.midnightlabai.com that talks directly to the provider of your choice — no hardcoded model, so it cannot break the way the original did when its model was retired.

- **Two providers, switchable in the header**: ☁️ OpenRouter in the cloud, or 🖥️ Ollama entirely on your own machine — no API key, no per-request cost, and no image ever leaves your computer. Model, API key and Ollama address are stored per provider.
- **Four modes**: **Image → Prompt** (reverse-engineer a generation prompt from an image), **Idea → Prompt** (expand a short idea), **Image → Image** (edit prompt from a change description), **Image → Video** (motion prompt from a start frame, optionally to an end frame). Upload via drag & drop, click, or Ctrl+V.
- **27 target platforms** across the modes, each with its own output format — from SDXL tag prompts with a negative prompt, through Midjourney `--ar` parameters and img2img denoise/mask hints, to Veo 3 audio lines.
- **Aspect ratios** (Auto, 1:1, 16:9, 9:16, 4:3, 3:2) and collapsible **technical parameters** (Logic Mode, camera angle, shot type, perspective, composition, lighting, atmosphere, mood, emotion) mirroring the original Midnight LAB v2.0 UI
- **Uncensored**: NSFW toggle with unmoderated default models (Qwen3-VL family in the cloud, qwen2.5vl/LLaVA locally); hard limits against illegal content always active
- **Bilingual UI** (DE/EN), streaming output, 3-variation mode, local history

## Usage

Unpack the archive and start the page:

- **Windows**: double-click `start.bat`
- **macOS / Linux**: `python3 serve.py`

Then pick a provider in the top-right header:

- **Ollama** (local): `ollama pull qwen2.5vl:7b` once, and the launcher handles the rest. The three image modes need a vision model; text-only models work in "Idea → Prompt" alone.
- **OpenRouter** (cloud): add your [API key](https://openrouter.ai/keys) under ⚙️ Settings and choose a vision model.

For Ollama the page has to be served from `localhost` — hosting it on GitHub Pages works with OpenRouter only. See the [README](README.md) for details.
