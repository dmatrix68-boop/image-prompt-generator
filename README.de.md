# ⚡ The Prompt Engine — Uncensored (OpenRouter- & Ollama-Edition)

*[English version](README.md)*

Funktionaler Nachbau von *thepromptengine.midnightlabai.com* — ohne dessen Kernfehler:
Das Original hatte `gemini-2.5-flash` fest im Frontend-Bundle verdrahtet; nachdem Google
das Modell für neue API-Konten abgeschaltet hat, lief jeder neue Key auf einen 404.

Dieser Klon nutzt stattdessen **frei wählbare Vision-Modelle** — kein Modell ist
hartkodiert, die Modellliste wird zur Laufzeit geladen. Umschaltbar zwischen zwei
Anbietern:

- **OpenRouter** (Cloud) — riesiger Modellkatalog, API-Key nötig, kostet pro Anfrage.
- **Ollama** (lokal) — läuft auf dem eigenen Rechner: kein API-Key, keine Kosten,
  keine Bilder verlassen den Rechner.

Der Umschalter sitzt oben rechts in der Kopfzeile (☁️ OpenRouter / 🖥️ Ollama) und
zusätzlich in den ⚙️ Einstellungen. Modell, API-Key und Ollama-Adresse werden je
Anbieter getrennt gespeichert — ein Wechsel verliert also keine Einstellung.

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
- **Zweisprachig**: Sprachumschalter (DE/EN) oben rechts, Auswahl wird gespeichert.
- **Optionen**: Stil-Vorgabe, Detailgrad, 3-Varianten-Modus, Streaming-Ausgabe,
  Kopier-Button, lokaler Verlauf.
- **Unzensiert**: NSFW-Schalter — explizite Bilder werden direkt und ohne Umschreibungen
  analysiert. Empfohlene Standard-Modelle (Qwen3-VL-Familie) laufen auf unmoderierten
  OpenRouter-Endpoints; lokal via Ollama entscheidet ohnehin nur das Modell selbst.
  Harte Grenzen bleiben immer aktiv: keine Darstellungen Minderjähriger, keine
  sexuellen Inhalte realer, identifizierbarer Personen.
- **Kein Backend**: Reines statisches Frontend. Der API-Key bleibt im localStorage des
  Browsers und geht ausschließlich direkt an `openrouter.ai` — bzw. bei Ollama an den
  eigenen Rechner.

## Nutzung

1. Seite starten — lokal reicht ein statischer Server:
   ```bash
   python3 -m http.server 8080
   # → http://localhost:8080
   ```
   Alternativ auf GitHub Pages / Netlify / einem beliebigen Webspace ablegen.
2. Anbieter oben rechts wählen und unter **⚙️ Einstellungen** einrichten
   (siehe unten).
3. Bild hochladen oder Idee eingeben → **⚡ Prompt generieren**.

### Variante A: OpenRouter (Cloud)

1. API-Key auf [openrouter.ai/keys](https://openrouter.ai/keys) erstellen.
2. Unter **⚙️ Einstellungen** den Key eintragen und ein Vision-Modell wählen.

### Variante B: Ollama (lokal)

1. [Ollama installieren](https://ollama.com/download) und ein Vision-Modell laden:
   ```bash
   ollama pull qwen2.5vl:7b
   ```
2. Ollama so starten, dass der Browser darauf zugreifen darf. Ohne
   `OLLAMA_ORIGINS` blockt Ollamas CORS-Prüfung die Anfragen aus der Seite:
   ```bash
   # Linux / macOS
   OLLAMA_ORIGINS='*' OLLAMA_CONTEXT_LENGTH=8192 ollama serve
   ```
   ```powershell
   # Windows (PowerShell), danach Ollama neu starten
   setx OLLAMA_ORIGINS "*"
   setx OLLAMA_CONTEXT_LENGTH "8192"
   ```
   Statt `*` kann man die Origin der Seite auch exakt angeben, z.B.
   `OLLAMA_ORIGINS='http://localhost:8080'`.
3. In der Kopfzeile auf **🖥️ Ollama** umschalten. Unter **⚙️ Einstellungen** steht
   die Adresse (Standard `http://localhost:11434`); **🔄 Modellliste laden** zeigt
   alle installierten Modelle, getrennt nach „mit Bild-Unterstützung“ und „nur Text“.

**Hinweise zu Ollama**

- **Bild → Prompt** braucht ein multimodales Modell (`qwen2.5vl`, `llava`,
  `minicpm-v`, `llama3.2-vision`, `gemma3`). Reine Text-Modelle funktionieren nur
  im Modus **Idee → Prompt**.
- `OLLAMA_CONTEXT_LENGTH` sollte bei ≥ 8192 liegen: Bild-Tokens plus der lange
  System-Prompt sprengen sonst das Standard-Kontextfenster, und der Anfang des
  Prompts wird abgeschnitten.
- Wird die Seite über **https** ausgeliefert, blockieren Browser den Aufruf des
  `http://localhost`-Endpunkts als Mixed Content. Für den Ollama-Betrieb die Seite
  also lokal über `http://localhost` öffnen.

## Modell-Hinweise

- **OpenRouter**, für unzensierte Analyse: **Qwen3 VL 235B / 30B / 32B** oder
  **Qwen2.5 VL 72B** (unmoderierte Endpoints, günstig). Grok ist ebenfalls wenig
  restriktiv.
- **Ollama**, lokal: **qwen2.5vl:7b** (~6 GB, schnell, kaum moderiert),
  **qwen2.5vl:32b** (beste Qualität, ~21 GB VRAM), **llava:13b**,
  **minicpm-v:8b** (genügsam). `llama3.2-vision` und `gemma3` funktionieren gut,
  sind aber deutlich moderierter.
- GPT-, Claude- und Gemini-Modelle funktionieren für SFW-Inhalte, verweigern aber
  in der Regel NSFW-Bilder.
- Ist ein Modell irgendwann nicht mehr verfügbar (der Fehler des Originals), einfach
  in den Einstellungen ein anderes wählen — oder eine beliebige Modell-ID von Hand
  eintragen.

## Rechtliches

Nur für volljährige Nutzer. Bei Cloud-Nutzung gelten die Nutzungsbedingungen von
OpenRouter und des jeweiligen Modell-Anbieters weiterhin und liegen in der
Verantwortung des Nutzers. Bei lokalem Betrieb über Ollama gelten die Lizenzen der
jeweils geladenen Modelle.
