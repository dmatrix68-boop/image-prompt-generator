#!/usr/bin/env bash
# Baut das Release-Zip mit derselben Dateiliste wie .github/workflows/release.yml
# und prüft das Ergebnis. Aufruf: build-package.sh <tag> [ref]   (ref: default origin/main)
#
# Gebaut wird aus dem Git-Ref, nicht aus dem Arbeitsverzeichnis: der Workflow
# checkt ebenfalls den Ref aus, und so fallen ungespeicherte oder vergessene
# Änderungen hier auf statt erst im veröffentlichten Paket.
set -euo pipefail

TAG="${1:?Aufruf: build-package.sh <tag> [ref]}"
REF="${2:-origin/main}"
FILES=(index.html css js docs start.bat serve.py README.md README.de.md LICENSE)
ZIP="dist/image-prompt-generator-${TAG}.zip"

cd "$(git rev-parse --show-toplevel)"
rm -rf dist && mkdir -p dist/stage
git archive --format=tar "$REF" "${FILES[@]}" | tar x -C dist/stage
(cd dist/stage && zip -rq "../${ZIP##*/}" "${FILES[@]}")
rm -rf dist/stage

python3 - "$ZIP" "$TAG" <<'PY'
import re, sys, zipfile
path, tag = sys.argv[1], sys.argv[2]
z = zipfile.ZipFile(path)
ok = True

def check(label, passed, detail=""):
    global ok
    ok = ok and passed
    print(f"  {'OK  ' if passed else 'FEHLT'} {label}{(' — ' + detail) if detail else ''}")

print(f"{path}  ({len(z.namelist())} Einträge)")
check("Archiv unbeschädigt", z.testzip() is None)
# Der Footer steht sichtbar auf jeder Seite und muss zum Tag passen.
html = z.read("index.html").decode("utf-8")
check(f"Versions-Footer = {tag}", f'version-footer">{tag}<' in html,
      "index.html bumpen" if f'version-footer">{tag}<' not in html else "")
# Ohne CRLF liest cmd.exe mehrzeilige Bloecke falsch und der Windows-Start bricht ab.
check("start.bat mit CRLF", z.read("start.bat").count(b"\r\n") > 3)
for name in ("css/style.css", "js/app.js", "serve.py", "README.md", "README.de.md", "LICENSE"):
    check(name, name in z.namelist() and len(z.read(name)) > 0)
# Die READMEs binden die Screenshots relativ ein; fehlen sie im Archiv, sind es
# im ausgepackten Paket tote Bildverweise.
refs = set()
for readme in ("README.md", "README.de.md"):
    refs |= set(re.findall(r"!\[[^\]]*\]\((docs/[^)\s]+)\)", z.read(readme).decode("utf-8")))
for name in sorted(refs):
    check(name, name in z.namelist() and len(z.read(name)) > 0, "in den READMEs verlinkt")
sys.exit(0 if ok else 1)
PY

echo
echo "Fertig: $ZIP"
echo "Optionaler Laufzeit-Test:"
echo "  unzip -q $ZIP -d /tmp/pe && (cd /tmp/pe && python3 serve.py --no-ollama)"
