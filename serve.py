#!/usr/bin/env python3
"""Serviert diesen Ordner unter http://127.0.0.1 und öffnet die Seite im Browser.

Warum überhaupt ein Server? Für den lokalen Ollama-Betrieb muss die Seite von
localhost kommen: Ollama akzeptiert Browser-Anfragen von localhost/127.0.0.1 auf
jedem Port, aber nicht von einer per Doppelklick geöffneten file://-Seite (Origin
"null") und nicht von einer https-Seite (die der Browser als Mixed Content blockt).

Nebenbei wird geprüft, ob der lokale Ollama-Server läuft, und er notfalls
gestartet. Schlägt das fehl, startet die Seite trotzdem — sie funktioniert dann
mit OpenRouter weiter.

Außerdem reicht der Server unter /comfyui-proxy/ genau zwei Aufrufe an
ComfyUI-Lora-Manager weiter (Nodes abfragen, Prompt einsetzen). ComfyUI lehnt
Browser-Anfragen von einem anderen Port ab, solange es nicht mit
--enable-cors-header läuft; über den Proxy kommen sie von hier statt vom Browser.

Aufruf: python serve.py [--no-ollama]   (Windows: start.bat doppelklicken)
"""

import http.server
import json
import re
import os
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

# Der Reihe nach probierte Ports. Mehrere, weil auf Windows ganze Bereiche durch
# Hyper-V/WSL/Docker reserviert sein können.
PORTS = (8000, 8080, 5500, 3000, 8765, 8899)

# Adresse, unter der die Seite Ollama standardmäßig erwartet.
OLLAMA_URL = "http://127.0.0.1:11434"
OLLAMA_WAIT_SECONDS = 30

ROOT = os.path.dirname(os.path.abspath(__file__))

# Proxy zu ComfyUI-Lora-Manager. Bewusst eine feste Liste statt eines offenen
# Durchreichens: nur was die Seite braucht, und nichts, was Workflows startet.
COMFY_PROXY_PREFIX = "/comfyui-proxy"
COMFY_PROXY_ROUTES = {
    ("GET", "/api/lm/get-registry"),
    ("POST", "/api/lm/update-node-widget"),
}
COMFY_DEFAULT_URL = "http://127.0.0.1:8188"
COMFY_TIMEOUT_SECONDS = 10
COMFY_MAX_BODY = 1024 * 1024

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

    def do_GET(self):
        if self.path.startswith(COMFY_PROXY_PREFIX + "/"):
            self.proxy_comfy("GET")
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith(COMFY_PROXY_PREFIX + "/"):
            self.proxy_comfy("POST")
        else:
            self.send_error(501, "Unsupported method ('POST')")

    def proxy_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.proxy_reply(status, "application/json", body)

    def proxy_reply(self, status, content_type, body):
        self.send_response(status)
        # Kennung für die Seite: Diese Antwort kommt vom Proxy, nicht von einem
        # beliebigen Webserver, der den Pfad nur nicht kennt.
        self.send_header("X-Prompt-Engine-Proxy", "1")
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def same_origin(self):
        """Nur Anfragen dieser Seite selbst durchlassen.

        Sonst könnte jede fremde Webseite im Browser über den Proxy an ComfyUI
        schreiben — genau das, wovor ComfyUIs eigene Origin-Prüfung schützt.
        """
        # Host muss localhost sein: Eine fremde Domain, die per DNS-Rebinding auf
        # 127.0.0.1 zeigt, hätte sonst eine passende Origin.
        host = urllib.parse.urlsplit("//" + (self.headers.get("Host") or "")).hostname
        if host not in ("localhost", "127.0.0.1", "::1"):
            return False
        site = self.headers.get("Sec-Fetch-Site")
        if site and site not in ("same-origin", "none"):
            return False
        origin = self.headers.get("Origin")
        if origin:
            return urllib.parse.urlsplit(origin).netloc.lower() == (self.headers.get("Host") or "").lower()
        # Browser senden bei POST immer eine Origin; fehlt sie, kommt die Anfrage
        # nicht aus einer Seite.
        return self.command == "GET"

    def proxy_comfy(self, method):
        path = urllib.parse.urlsplit(self.path).path[len(COMFY_PROXY_PREFIX):]
        if (method, path) not in COMFY_PROXY_ROUTES:
            self.proxy_json(404, {"success": False, "error": "Not proxied", "message": path})
            return
        if not self.same_origin():
            self.proxy_json(403, {"success": False, "error": "Forbidden", "message": "cross-origin request"})
            return

        target = (self.headers.get("X-Comfy-Target") or COMFY_DEFAULT_URL).strip().rstrip("/")
        if not re.match(r"^https?://[^/\s]+(/\S*)?$", target, re.IGNORECASE):
            self.proxy_json(400, {"success": False, "error": "Bad target", "message": target})
            return

        body = None
        if method == "POST":
            try:
                length = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                length = -1
            if not 0 < length <= COMFY_MAX_BODY:
                self.proxy_json(413, {"success": False, "error": "Bad body size"})
                return
            body = self.rfile.read(length)

        req = urllib.request.Request(target + path, data=body, method=method)
        if body is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with _direct.open(req, timeout=COMFY_TIMEOUT_SECONDS) as resp:
                self.proxy_reply(resp.status, resp.headers.get("Content-Type", "application/json"), resp.read())
        except urllib.error.HTTPError as err:
            # Fehlerantworten von ComfyUI/LoRA Manager unverändert weiterreichen —
            # die Seite wertet deren JSON (z.B. "Empty Registry") selbst aus.
            self.proxy_reply(err.code, err.headers.get("Content-Type", "text/plain"), err.read())
        except (urllib.error.URLError, OSError) as err:
            reason = getattr(err, "reason", err)
            self.proxy_json(502, {"success": False, "error": "ComfyUI unreachable", "message": str(reason)})


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
