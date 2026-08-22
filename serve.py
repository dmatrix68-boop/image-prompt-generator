#!/usr/bin/env python3
"""Serviert diesen Ordner unter http://127.0.0.1 und öffnet die Seite im Browser.

Warum überhaupt ein Server? Für den lokalen Ollama-Betrieb muss die Seite von
localhost kommen: Ollama akzeptiert Browser-Anfragen von localhost/127.0.0.1 auf
jedem Port, aber nicht von einer per Doppelklick geöffneten file://-Seite (Origin
"null") und nicht von einer https-Seite (die der Browser als Mixed Content blockt).

Nebenbei wird geprüft, ob der lokale Ollama-Server läuft, und er notfalls
gestartet. Schlägt das fehl, startet die Seite trotzdem — sie funktioniert dann
mit OpenRouter weiter.

Aufruf: python serve.py [--no-ollama]   (Windows: start.bat doppelklicken)
"""

import http.server
import json
import os
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser

# Der Reihe nach probierte Ports. Mehrere, weil auf Windows ganze Bereiche durch
# Hyper-V/WSL/Docker reserviert sein können.
PORTS = (8000, 8080, 5500, 3000, 8765, 8899)

# Adresse, unter der die Seite Ollama standardmäßig erwartet.
OLLAMA_URL = "http://127.0.0.1:11434"
OLLAMA_WAIT_SECONDS = 30

ROOT = os.path.dirname(os.path.abspath(__file__))

# Kein Proxy für localhost: Ein systemweit gesetztes http_proxy würde urllib sonst
# auch bei 127.0.0.1 über den Proxy schicken und die Prüfung fälschlich scheitern lassen.
_direct = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def ollama_models():
    """Installierte Modelle, oder None wenn Ollama nicht antwortet."""
    try:
        with _direct.open(f"{OLLAMA_URL}/api/tags", timeout=2) as resp:
            return json.load(resp).get("models", [])
    except Exception:
        return None


def launch_ollama():
    """Startet `ollama serve` im Hintergrund. Gibt False zurück, wenn ollama fehlt."""
    exe = shutil.which("ollama")
    if not exe:
        return False
    kwargs = {"stdout": subprocess.DEVNULL, "stderr": subprocess.DEVNULL}
    if os.name == "nt":
        # DETACHED_PROCESS | CREATE_NO_WINDOW: kein zweites Konsolenfenster, und der
        # Server überlebt das Schließen dieses Fensters.
        kwargs["creationflags"] = 0x00000008 | 0x08000000
    else:
        kwargs["start_new_session"] = True
    try:
        subprocess.Popen([exe, "serve"], **kwargs)
    except OSError:
        return False
    return True


def ensure_ollama():
    """Prüft Ollama und startet es bei Bedarf. Rein informativ — nie fatal."""
    models = ollama_models()
    if models is None:
        print("Ollama antwortet nicht — starte es ...")
        if not launch_ollama():
            print(
                "  Ollama wurde nicht gefunden. Für den lokalen Betrieb von\n"
                "  https://ollama.com/download installieren. Die Seite startet trotzdem\n"
                "  und funktioniert mit OpenRouter."
            )
            return
        deadline = time.monotonic() + OLLAMA_WAIT_SECONDS
        while time.monotonic() < deadline:
            time.sleep(0.5)
            models = ollama_models()
            if models is not None:
                break
        else:
            print(
                f"  Ollama wurde gestartet, war aber nach {OLLAMA_WAIT_SECONDS}s noch nicht\n"
                "  erreichbar. Einmal von Hand `ollama serve` ausführen zeigt den Grund."
            )
            return
        print("  Ollama läuft jetzt.")
    else:
        print("Ollama läuft bereits.")

    if models:
        names = ", ".join(m.get("name", "?") for m in models[:4])
        more = f" (+{len(models) - 4} weitere)" if len(models) > 4 else ""
        print(f"  {len(models)} Modelle installiert: {names}{more}")
    else:
        print("  Noch kein Modell installiert — z.B.: ollama pull qwen2.5vl:7b")


def pick_port():
    """Erster Port, der sich tatsächlich binden lässt — oder None.

    Bewusst ein echter bind() und keine netstat-artige Prüfung: Auf Windows
    scheitert das Binden in einem reservierten Portbereich mit WinError 10013,
    obwohl dort gar nichts lauscht. Nur der Bind-Versuch deckt das auf.
    """
    for port in PORTS:
        with socket.socket() as probe:
            try:
                probe.bind(("127.0.0.1", port))
            except OSError:
                continue
        return port
    return None


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)


def main():
    # Ordnerprüfung zuerst: Bei falschem Ordner soll nicht erst 30s auf Ollama
    # gewartet werden, bevor der eigentliche Fehler erscheint.
    if not os.path.isfile(os.path.join(ROOT, "index.html")):
        sys.exit(
            f"FEHLER: index.html liegt nicht in {ROOT}\n"
            "Diese Datei muss im selben Ordner wie index.html, css/ und js/ liegen."
        )

    if "--no-ollama" not in sys.argv:
        ensure_ollama()
        print()

    port = pick_port()
    if port is None:
        sys.exit(
            "FEHLER: Keiner der Ports "
            + ", ".join(str(p) for p in PORTS)
            + " ließ sich belegen.\n"
            "Unter Windows sind Portbereiche oft durch Hyper-V/WSL reserviert; welche,\n"
            "zeigt: netsh int ipv4 show excludedportrange protocol=tcp"
        )

    url = f"http://127.0.0.1:{port}/"
    # Nur an 127.0.0.1 binden: Der Server ist damit ausschließlich lokal
    # erreichbar und nicht im umgebenden Netz sichtbar.
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler)

    print(f"The Prompt Engine läuft unter {url}")
    print(f"Ordner: {ROOT}")
    print("Zum Beenden dieses Fenster schließen oder Strg+C drücken.\n")

    # Kurzer Vorlauf, damit der Browser den Server bereits erreichbar vorfindet.
    threading.Timer(0.5, webbrowser.open, args=(url,)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer beendet.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
