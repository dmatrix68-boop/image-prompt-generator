**The Prompt Engine — Uncensored v1.3** does more than describe images: the same analysis now writes editing prompts and image-to-video prompts.

## New in v1.3

- **Image → Image**: upload a source image, describe the change in your own words, get a finished edit prompt. A **change scope** (minimal / moderate / strong) decides how much may shift around the requested edit — on "minimal" the prompt spells out what has to stay identical (identity, pose, background, lighting, framing), which is what keeps an editor from quietly re-rendering the whole picture. Seven target platforms: Nano Banana/Gemini, Flux.1 Kontext, Qwen-Image-Edit, Seedream/SeedEdit, GPT-Image/DALL-E edit, SD/SDXL img2img + inpainting (with a denoise recommendation and the region to mask), universal.
- **Image → Video**: upload a start frame, optionally an **end frame**, and describe what should happen — out comes an image-to-video prompt. With an end frame attached the second image is labelled as the target last frame, so the model describes one continuous transition instead of two separate shots. Camera movement (dolly, pan, tilt, orbit, crane, handheld, tracking, zoom), motion intensity (subtle / moderate / dynamic) and clip length are selectable. Nine target platforms: Kling, Runway Gen-4, Veo 3 (with a separate audio line), Hailuo/MiniMax, Luma Dream Machine/Ray, Wan 2.2, Sora 2, Seedance, universal.
- **Options that follow the mode**: the target-platform list changes with the tab and every group keeps its own selection, so switching modes never resets what you picked. Editing drops the aspect-ratio row — the source image sets the format — and reads the "Automatic" style as *keep the original look* rather than *derive a style*.

## What it is

A static, backend-free rebuild of thepromptengine.midnightlabai.com that talks directly to the provider of your choice — no hardcoded model, so it cannot break the way the original did when its model was retired.

- **Two providers, switchable in the header**: ☁️ OpenRouter in the cloud, or 🖥️ Ollama entirely on your own machine — no API key, no per-request cost, and no image ever leaves your computer. Model, API key and Ollama address are stored per provider.
- **Four modes**: **Image → Prompt** (reverse-engineer a generation prompt from an image), **Idea → Prompt** (expand a short idea), **Image → Image** (edit prompt from a change description), **Image → Video** (motion prompt from a start frame, optionally to an end frame). Upload via drag & drop, click, or Ctrl+V.
- **26 target platforms** across the modes, each with its own output format — from SDXL tag prompts with a negative prompt, through Midjourney `--ar` parameters and img2img denoise/mask hints, to Veo 3 audio lines.
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
