#!/usr/bin/env python3
# Dev-server zonder caching — voorkomt stale JS/CSS tijdens lokaal testen.
# Gebruik:  python3 scripts/devserver.py
import http.server, socketserver, os
from functools import partial

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
PORT = 8777

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), partial(NoCacheHandler, directory=ROOT)) as httpd:
    print(f"No-cache dev-server op http://127.0.0.1:{PORT}  (root: {ROOT})")
    httpd.serve_forever()
