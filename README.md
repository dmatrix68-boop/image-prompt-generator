# ⚡ The Prompt Engine — Uncensored (OpenRouter Edition)

*[Deutsche Version](README.de.md)*

Functional rebuild of *thepromptengine.midnightlabai.com* — without its fatal flaw:
the original hardcoded `gemini-2.5-flash` in its frontend bundle; after Google retired
that model for new API accounts, every new key ran into a 404.

This clone uses **OpenRouter** with a **freely selectable vision model** instead —
no model is hardcoded, and the model list is loaded live from the OpenRouter catalog.

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
  OpenRouter endpoints. Hard limits always stay active: no depictions of minors, no
  sexual content involving real, identifiable people.
- **No backend**: Pure static frontend. The API key stays in the browser's
  localStorage and is sent exclusively and directly to `openrouter.ai`.

## Usage

1. Create an API key at [openrouter.ai/keys](https://openrouter.ai/keys).
2. Serve the page — locally, any static server will do:
   ```bash
   python3 -m http.server 8080
   # → http://localhost:8080
   ```
   Alternatively host it on GitHub Pages / Netlify / any web space.
3. Enter the key under **⚙️ Settings** and pick a vision model.
4. Upload an image or enter an idea → **⚡ Generate prompt**.

## Model notes

- For uncensored analysis: **Qwen3 VL 235B / 30B / 32B** or **Qwen2.5 VL 72B**
  (unmoderated endpoints, cheap). Grok is also fairly permissive.
- GPT, Claude, and Gemini models work for SFW content but usually refuse NSFW images.
- If a model ever becomes unavailable (the original's bug), just pick another one in
  the settings — or enter any model ID by hand.

## Legal

For adult users only. The terms of use of OpenRouter and of the respective model
provider continue to apply and are the user's responsibility.
