First release of **The Prompt Engine — Uncensored (OpenRouter Edition)**: a static, backend-free rebuild of thepromptengine.midnightlabai.com that talks directly to OpenRouter with a user-supplied API key — no hardcoded model.

## Highlights

- **Image → Prompt**: upload via drag & drop, click, or Ctrl+V; a vision LLM reverse-engineers a generation prompt from the image
- **Idea → Prompt**: expands a short idea into a professional prompt
- **10 target platforms**: SDXL, Pony/Illustrious, Flux, Midjourney, DALL-E, Ideogram, Nano Banana/Gemini, Qwen-Image, Krea 2, universal — each with platform-specific output format
- **Aspect ratios** (Auto, 1:1, 16:9, 9:16, 4:3, 3:2) and collapsible **technical parameters** (Logic Mode, camera angle, shot type, perspective, composition, lighting, atmosphere, mood, emotion) mirroring the original Midnight LAB v2.0 UI
- **Free model choice**: live model list from the OpenRouter catalog, custom model ID fallback — the original's fatal hardcoded-model bug is structurally fixed
- **Uncensored**: NSFW toggle with unmoderated default models (Qwen3-VL family); hard limits against illegal content always active
- **Bilingual UI** (DE/EN), streaming output, 3-variation mode, local history

## Usage

Serve the repo with any static file server, add your [OpenRouter API key](https://openrouter.ai/keys) under ⚙️ Settings, and generate. See the [README](README.md) for details.
