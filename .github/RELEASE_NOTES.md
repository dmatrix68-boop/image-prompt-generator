**The Prompt Engine — Uncensored v1.3.1** is a documentation release: the READMEs now show what each of the four modes actually looks like, and the archive carries those images along.

## New in v1.3.1

- **Screenshots of all four modes**, in German and English, one set per README. They show what changes with the tab: the optional end frame plus the camera, motion and clip-length selectors in *Image → Video*, the change-scope selector instead of the aspect-ratio row in *Image → Image*, and no image area at all in *Idea → Prompt*. Source images, inputs and results in the screenshots are illustrative examples — the captions say so, since in use the prompts come from whichever model you selected.
- **The `docs/` folder ships with the archive.** The READMEs link the screenshots relatively, so without those files an unpacked release showed broken images. The packaging check now verifies that every image the READMEs link is really inside the archive. This is why the download is a few megabytes instead of a few hundred kilobytes.

Nothing changed in the application itself: apart from the version footer, `index.html`, `css/style.css` and `js/app.js` are identical to v1.3. If you are already running v1.3, there is no functional reason to update.

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
