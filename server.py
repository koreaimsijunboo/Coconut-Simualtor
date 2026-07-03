#!/usr/bin/env python3
"""
Simple static file server for the Coconut Simulator.

Usage:
  python3 server.py           # serve on http://localhost:8000/
  python3 server.py -p 9000   # serve on port 9000
  python3 server.py --open    # open the URL in the default browser
"""
import argparse
import http.server
import socketserver
import webbrowser
import os
import sys


def run_server(port: int, host: str, open_browser: bool) -> None:
    # Serve files from the directory containing this script
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)

    handler = http.server.SimpleHTTPRequestHandler
    class ReusableTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    with ReusableTCPServer((host, port), handler) as httpd:
        url = f"http://{host if host else 'localhost'}:{port}/"
        print(f"Serving {base_dir} at {url}")
        if open_browser:
            try:
                webbrowser.open(url)
            except Exception:
                pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nKeyboard interrupt received, shutting down server")
            httpd.shutdown()


def main():
    parser = argparse.ArgumentParser(description="Simple static server for Coconut Simulator")
    parser.add_argument('-p', '--port', type=int, default=8000, help='Port to serve on (default: 8000)')
    parser.add_argument('-H', '--host', default='localhost', help='Host to bind to (default: localhost). Use 0.0.0.0 to expose externally')
    parser.add_argument('--open', action='store_true', help='Open the served URL in the default browser')
    args = parser.parse_args()

    run_server(args.port, args.host, args.open)


if __name__ == '__main__':
    main()
