**The Prompt Engine — Uncensored v1.5.0** sends finished prompts straight into a ComfyUI workflow via ComfyUI-Lora-Manager.

## New in v1.5.0

- **Send to ComfyUI (LoRA Manager)**: a paper-plane button next to *Copy* puts the generated prompt and negative prompt directly into text nodes of the workflow open in ComfyUI — no more copy and paste between two browser tabs. It uses the interface of [ComfyUI-Lora-Manager](https://github.com/willmiao/ComfyUI-Lora-Manager), the same route its own "Send to workflow" button takes, so it needs that custom node installed and the workflow open in the browser.
  - The dialog lists the matching nodes of the open workflow — **Prompt (LoraManager)**, **Text (LoraManager)** and **CLIP Text Encode**, plus any node marked via right-click → *Mark as → Send Prompt Target*. Bypassed nodes and nodes whose text field is fed by a link are left out, because writing into them would have no effect.
  - The output is split before sending: only the prompt and the negative prompt go to ComfyUI, extras such as `RESOLUTION:` do not. In 3-variation mode you pick the variant.
  - Text replaces the node's content by default, or is appended on request. The page remembers the nodes you picked; the first time round, a node with "neg" in its title gets the negative prompt.
  - ComfyUI rejects browser requests from another port (HTTP 403) unless started with `--enable-cors-header`. So `start.bat` / `serve.py` now include a small proxy that forwards exactly these two calls and only accepts requests from the page itself — ComfyUI's default configuration is enough. Served any other way, the page talks to ComfyUI directly, which then needs `--enable-cors-header`.

## What it is

A static, backend-free rebuild of thepromptengine.midnightlabai.com that talks directly to the provider of your choice — no hardcoded model, so it cannot break the way the original did when its model was retired.

- **Two providers, switchable in the header**: ☁️ OpenRouter in the cloud, or 🖥️ Ollama entirely on your own machine — no API key, no per-request cost, and no image ever leaves your computer. Model, API key and Ollama address are stored per provider.
- **Four modes**: **Image → Prompt** (reverse-engineer a generation prompt from an image), **Idea → Prompt** (expand a short idea), **Image → Image** (edit prompt from a change description), **Image → Video** (motion prompt from a start frame, optionally to an end frame). Upload via drag & drop, click, or Ctrl+V.
- **27 target platforms** across the modes, each with its own output format — from SDXL tag prompts with a negative prompt, through Midjourney `--ar` parameters and img2img denoise/mask hints, to Veo 3 audio lines.
- **Aspect ratios** (Auto, 1:1, 16:9, 9:16, 4:3, 3:2) and collapsible **technical parameters** (Logic Mode, camera angle, shot type, perspective, composition, lighting, atmosphere, mood, emotion) mirroring the original Midnight LAB v2.0 UI
- **Uncensored**: NSFW toggle with unmoderated default models (Qwen3-VL family in the cloud, qwen2.5vl/LLaVA locally); hard limits against illegal content always active
- **Send to ComfyUI**: prompt and negative prompt straight into the nodes of an open workflow, via ComfyUI-Lora-Manager
- **Bilingual UI** (DE/EN), streaming output, 3-variation mode, local history

## Usage

Unpack the archive and start the page:

- **Windows**: double-click `start.bat`
- **macOS / Linux**: `python3 serve.py`

Then pick a provider in the top-right header:

- **Ollama** (local): `ollama pull qwen2.5vl:7b` once, and the launcher handles the rest. The three image modes need a vision model; text-only models work in "Idea → Prompt" alone.
- **OpenRouter** (cloud): add your [API key](https://openrouter.ai/keys) under ⚙️ Settings and choose a vision model.

To send prompts to ComfyUI, install [ComfyUI-Lora-Manager](https://github.com/willmiao/ComfyUI-Lora-Manager) there, keep the workflow open in the browser and click the paper-plane button next to *Copy*.

For Ollama the page has to be served from `localhost` — hosting it on GitHub Pages works with OpenRouter only. See the [README](README.md) for details.
