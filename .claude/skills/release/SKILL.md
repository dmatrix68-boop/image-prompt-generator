---
name: release
description: Bereitet ein Release von "The Prompt Engine" vor und schneidet es — Versions-Footer, .github/RELEASE_NOTES.md, Feature-Listen in beiden READMEs, Paketbau samt Prüfung, danach der Release-Workflow. Diesen Skill verwenden, sobald es um eine neue Version geht: "Release", "Releasepaket", "neue Version", "v1.4 rausbringen", "Release vorbereiten", "Release Notes schreiben", "Version bumpen", "Paket bauen", "release cutten". Auch dann verwenden, wenn nur ein Teilschritt verlangt ist (etwa bloß das Paket oder bloß die Notes) — die Schritte hängen zusammen, und der Skill nennt die Kopplungen, die man dabei übersieht.
---

# Release schneiden

## Wie das Release hier funktioniert

Das Zippen und Veröffentlichen erledigt `.github/workflows/release.yml` — ein
`workflow_dispatch` mit den Eingaben `tag` (z.B. `v1.4`) und `title`. Der Job
checkt den gewählten Ref aus, baut daraus

    index.html css js docs start.bat serve.py README.md README.de.md LICENSE

zu `image-prompt-generator-<tag>.zip` und legt das Release mit
`gh release create --notes-file .github/RELEASE_NOTES.md` an.

Automatisiert ist damit alles ab dem Dispatch. Die Arbeit davor ist manuell, und
genau dort geht es schief: der Workflow nimmt kommentarlos, was im Repo steht.

## Ablauf

1. **Stand feststellen.** `git fetch --tags && git tag -l`, dann
   `git log <letzterTag>..origin/main --oneline`. Daraus die neue Version
   ableiten — neue Funktionen heben die Minor-Stelle, reine Korrekturen die
   Patch-Stelle.
2. **Versions-Footer bumpen.** `<div class="version-footer">vX.Y</div>` in
   `index.html`. Er steht sichtbar auf jeder Seite; weicht er vom Tag ab,
   meldet später jemand einen Fehler gegen die falsche Version.
3. **`.github/RELEASE_NOTES.md` neu schreiben.** Die Datei beschreibt genau
   *ein* Release — das gerade anstehende. Nicht ergänzen, sondern um die neuen
   Funktionen herum neu aufbauen (Aufbau siehe unten). Grundlage ist das
   Commit-Log aus Schritt 1, nicht die Erinnerung.
4. **Zahlen und Aufzählungen gegen den Code prüfen**, in den Notes *und* in
   `README.md` und `README.de.md`. Angaben wie „10 Ziel-Plattformen" oder „zwei
   Modi" veralten still — sie stehen an drei Stellen und niemand merkt, dass sie
   nicht mehr stimmen. Also nachzählen: die Plattformen in `PLATFORMS` in
   `js/app.js`, die Modi an den Tabs in `index.html`.
5. **Paket bauen und prüfen:** `bash .claude/skills/release/scripts/build-package.sh vX.Y`.
   Das baut aus `origin/main` exakt dieselbe Dateiliste wie der Workflow und
   prüft Archiv, Footer und Zeilenenden. Bei Zweifeln zusätzlich entpacken,
   `python3 serve.py --no-ollama` starten und die Seite im Browser laden — der
   Skript-Check sieht nur Dateien, keine Laufzeitfehler.
6. **Committen und mergen lassen.** Der Workflow liest die Notes vom Ref, den er
   auscheckt. Solange der Commit nur auf einem Feature-Branch liegt, würde ein
   Dispatch auf `main` die *alten* Notes veröffentlichen. Also erst PR mergen.
7. **Workflow starten**: Actions → *Create Release* → Run workflow auf `main`,
   `tag` = `vX.Y`, `title` = `The Prompt Engine — Uncensored vX.Y` (so heißen
   alle bisherigen Releases; ohne Titel steht dort nur der Tag).
8. **Nachsehen**, ob Release und Zip-Anhang da sind und der Text der neuen
   Version entspricht.

## Was erfahrungsgemäß schiefgeht

- **Die Notes beschreiben noch die Vorversion.** Bei v1.2 und v1.3 jeweils
  passiert. Schritt 3 ist der eigentliche Inhalt des Releases, nicht Beiwerk.
- **Ein zweiter Dispatch repariert den Text nicht.** Existiert das Release zum
  Tag schon, lädt der Workflow nur das Zip neu hoch (`--clobber`) und rührt die
  Notes nicht an. Ein falscher Text muss danach direkt am Release auf GitHub
  bearbeitet werden.
- **`start.bat` braucht CRLF.** `.gitattributes` erzwingt das; ohne die
  Zeilenenden liest `cmd.exe` mehrzeilige Blöcke falsch und der Windows-Start
  bricht ab. Das Prüfskript testet es im fertigen Archiv.
- **Die Screenshots in `docs/screenshots/` zeigen den Versions-Footer der Version,
  in der sie entstanden sind.** Das ist Absicht: neu erzeugen heißt jedes Mal rund
  3 MB neue Bilddaten in der Git-Historie, nur damit eine Zahl in der Ecke stimmt.
  Neu aufnehmen also nur, wenn sich die Oberfläche wirklich geändert hat.
- **`dist/` gehört nicht ins Repo** — steht in `.gitignore`, ist aber schnell
  mit `git add -A` mitgenommen.

## Aufbau der Release Notes

Vier Teile, so wie in den bisherigen Releases:

1. Ein Einleitungssatz, der sagt, worum es in dieser Version geht.
2. `## New in vX.Y` — die neuen Funktionen. Beschreiben, was sie dem Nutzer
   bringen und warum sie so gebaut sind, nicht nur, dass es sie gibt.
3. `## What it is` — die Kurzvorstellung des Projekts für alle, die das Release
   ohne Vorgeschichte finden. Hier stecken die Zahlen aus Schritt 4.
4. `## Usage` — Entpacken, starten, Anbieter wählen.

Die Notes sind englisch (das Release ist öffentlich), die READMEs bleiben
zweisprachig — Änderungen an Feature-Listen also immer in beiden nachziehen.
