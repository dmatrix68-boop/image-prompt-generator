#!/usr/bin/env python3
"""Serviert diesen Ordner unter http://127.0.0.1 und öffnet die Seite im Browser.

Warum überhaupt ein Server? Für den lokalen Ollama-Betrieb muss die Seite von
localhost kommen: Ollama akzeptiert Browser-Anfragen von localhost/127.0.0.1 auf
jedem Port, aber nicht von einer per Doppelklick geöffneten file://-Seite (Origin
"null") und nicht von einer https-Seite (die der Browser als Mixed Content blockt).

Aufruf: python serve.py   (Windows: start.bat doppelklicken)
"""

import http.server
import os
import socket
import sys
import threading
import webbrowser

# Der Reihe nach probierte Ports. Mehrere, weil auf Windows ganze Bereiche durch
# Hyper-V/WSL/Docker reserviert sein können.
PORTS = (8000, 8080, 5500, 3000, 8765, 8899)

ROOT = os.path.dirname(os.path.abspath(__file__))


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
    if not os.path.isfile(os.path.join(ROOT, "index.html")):
        sys.exit(
            f"FEHLER: index.html liegt nicht in {ROOT}\n"
            "Diese Datei muss im selben Ordner wie index.html, css/ und js/ liegen."
        )

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
