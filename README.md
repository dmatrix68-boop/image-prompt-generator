# ⚡ The Prompt Engine — Uncensored (OpenRouter Edition)

Funktionaler Nachbau von *thepromptengine.midnightlabai.com* — ohne dessen Kernfehler:
Das Original hatte `gemini-2.5-flash` fest im Frontend-Bundle verdrahtet; nachdem Google
das Modell für neue API-Konten abgeschaltet hat, lief jeder neue Key auf einen 404.

Dieser Klon nutzt stattdessen **OpenRouter** mit **frei wählbarem Vision-Modell** —
kein Modell ist hartkodiert, die Modellliste wird live vom OpenRouter-Katalog geladen.

## Features

- **Bild → Prompt**: Bild hochladen (Drag & Drop, Klick oder Strg+V), ein Vision-LLM
  analysiert es und erzeugt einen detaillierten Generierungs-Prompt.
- **Idee → Prompt**: Kurze Idee eingeben, die Engine baut daraus einen Profi-Prompt.
- **Ziel-Plattformen**: SDXL (Tags + Negative Prompt), Pony/Illustrious (Booru-Tags
  inkl. score-/rating-Tags), Flux (Fließtext), Midjourney (inkl. `--ar`/`--stylize`),
  DALL-E, Ideogram, Nano Banana/Gemini, Qwen-Image (mit Text-Rendering), Krea 2
  (fotorealistisch), universell.
- **Bildformate**: Aspect-Ratio-Auswahl wie im Original (Auto, 1:1, 16:9, 9:16, 4:3,
  3:2) — bei Midjourney als `--ar`, bei SDXL/Pony mit passender Auflösungsempfehlung.
- **Technical Parameters** (wie im Original, ausklappbar): Logic Mode, Camera Angle,
  Shot Type, Perspective, Composition, Lighting, Atmosphere, Mood, Emotion — jeweils
  mit denselben Wertelisten wie Midnight LAB v2.0.
- **Optionen**: Stil-Vorgabe, Detailgrad, 3-Varianten-Modus, Streaming-Ausgabe,
  Kopier-Button, lokaler Verlauf.
- **Unzensiert**: NSFW-Schalter — explizite Bilder werden direkt und ohne Umschreibungen
  analysiert. Empfohlene Standard-Modelle (Qwen3-VL-Familie) laufen auf unmoderierten
  OpenRouter-Endpoints. Harte Grenzen bleiben immer aktiv: keine Darstellungen
  Minderjähriger, keine sexuellen Inhalte realer, identifizierbarer Personen.
- **Kein Backend**: Reines statisches Frontend. Der API-Key bleibt im localStorage des
  Browsers und geht ausschließlich direkt an `openrouter.ai`.

## Nutzung

1. API-Key auf [openrouter.ai/keys](https://openrouter.ai/keys) erstellen.
2. Seite starten — lokal reicht ein statischer Server:
   ```bash
   python3 -m http.server 8080
   # → http://localhost:8080
   ```
   Alternativ auf GitHub Pages / Netlify / einem beliebigen Webspace ablegen.
3. Unter **⚙️ Einstellungen** den Key eintragen und ein Vision-Modell wählen.
4. Bild hochladen oder Idee eingeben → **⚡ Prompt generieren**.

## Modell-Hinweise

- Für unzensierte Analyse: **Qwen3 VL 235B / 30B / 32B** oder **Qwen2.5 VL 72B**
  (unmoderierte Endpoints, günstig). Grok ist ebenfalls wenig restriktiv.
- GPT-, Claude- und Gemini-Modelle funktionieren für SFW-Inhalte, verweigern aber
  in der Regel NSFW-Bilder.
- Ist ein Modell irgendwann nicht mehr verfügbar (der Fehler des Originals), einfach
  in den Einstellungen ein anderes wählen — oder eine beliebige Modell-ID von Hand
  eintragen.

## Rechtliches

Nur für volljährige Nutzer. Die Nutzungsbedingungen von OpenRouter und des jeweiligen
Modell-Anbieters gelten weiterhin und liegen in der Verantwortung des Nutzers.
