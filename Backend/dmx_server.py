from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import subprocess
import argparse
import json
import logging
import time
from threading import Thread

try:
    # websocket-client library
    from websocket import WebSocketApp
except Exception:
    WebSocketApp = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

app = Flask(__name__)
# Restrict CORS to the known control UI (adjust origin as needed)
CORS(app, resources={r"/api/*": {"origins": ["http://192.168.0.33"]}})


def run_dmx_change(data):
    """Run the local ../dmx_usb binary with validated data dict."""
    # Validate and clamp values to 0..255
    def clamp(v):
        try:
            iv = int(v)
        except Exception:
            iv = 0
        return max(0, min(255, iv))

    args = [
        "../dmx_usb",
        "change_color",
        str(clamp(data.get("intensity", 0))),
        str(clamp(data.get("red", 0))),
        str(clamp(data.get("green", 0))),
        str(clamp(data.get("blue", 0))),
        str(clamp(data.get("white", 0))),
        str(clamp(data.get("amber", 0))),
        str(clamp(data.get("violet", 0))),
        str(clamp(data.get("strobe", 0))),
        str(clamp(data.get("color_shift", 0)))
    ]

    logging.info("Running DMX command: %s", " ".join(args))
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            logging.info("DMX updated: %s", result.stdout.strip())
            return True, result.stdout
        else:
            logging.error("DMX program returned error: %s", result.stderr.strip())
            return False, result.stderr
    except Exception as e:
        logging.exception("Failed to run DMX program: %s", e)
        return False, str(e)


@app.route('/api/set_color', methods=['POST'])
def set_color():
    data = request.get_json()
    if data is None:
        return jsonify({'message': 'No data received'}), 400

    ok, out = run_dmx_change(data)
    if ok:
        return jsonify({"status": "success", "message": "Color updated"}), 200
    else:
        return jsonify({"status": "error", "message": out}), 500


class WSClient:
    """A simple reconnecting WebSocket client that expects JSON messages with color fields."""

    def __init__(self, url, auth_token=None, ping_interval=20, backoff=5):
        if WebSocketApp is None:
            raise RuntimeError("websocket-client package is not installed")
        self.url = url
        self.auth_token = auth_token
        self.ping_interval = ping_interval
        self.backoff = backoff
        self._ws = None
        self._stop = False

    def _on_message(self, ws, message):
        try:
            payload = json.loads(message)
        except Exception:
            logging.warning("Received non-JSON message from WS")
            return

        # If server includes an auth token field, check it
        if self.auth_token:
            token = payload.get("token") or payload.get("auth")
            if token != self.auth_token:
                logging.warning("WS message auth failed")
                return

        # Run DMX command in background thread to avoid blocking WS
        Thread(target=run_dmx_change, args=(payload,)).start()

    def _on_open(self, ws):
        logging.info("WebSocket opened to %s", self.url)

    def _on_close(self, ws, close_status_code, close_msg):
        logging.info("WebSocket closed: %s %s", close_status_code, close_msg)

    def _on_error(self, ws, error):
        logging.error("WebSocket error: %s", error)

    def run_forever(self):
        while not self._stop:
            try:
                self._ws = WebSocketApp(self.url,
                                        on_open=self._on_open,
                                        on_message=self._on_message,
                                        on_error=self._on_error,
                                        on_close=self._on_close)
                self._ws.run_forever(ping_interval=self.ping_interval, ping_timeout=10)
            except Exception as e:
                logging.exception("WS client crashed: %s", e)
            if self._stop:
                break
            logging.info("WS reconnecting in %s seconds...", self.backoff)
            time.sleep(self.backoff)

    def stop(self):
        self._stop = True
        try:
            if self._ws:
                self._ws.close()
        except Exception:
            pass


def start_ws_client_in_thread(url, auth_token=None):
    client = WSClient(url, auth_token=auth_token)
    t = Thread(target=client.run_forever, daemon=True)
    t.start()
    return client


def parse_args():
    p = argparse.ArgumentParser(description="DMX server — HTTP API and optional WebSocket client mode")
    p.add_argument('--mode', choices=['http', 'ws', 'both'], default='http', help='Run in http (default), ws (client) or both')
    p.add_argument('--ws-url', default=None, help='WebSocket URL to connect to when running in ws or both mode')
    p.add_argument('--ws-token', default=None, help='Optional auth token expected in WS messages')
    p.add_argument('--host', default='0.0.0.0', help='Host for HTTP server')
    p.add_argument('--port', type=int, default=5000, help='Port for HTTP server')
    return p.parse_args()


def main():
    args = parse_args()
    ws_client = None
    if args.mode in ('ws', 'both'):
        if not args.ws_url:
            logging.error('ws mode requires --ws-url')
            return
        ws_client = start_ws_client_in_thread(args.ws_url, auth_token=args.ws_token)

    if args.mode in ('http', 'both'):
        logging.info('Starting HTTP API on %s:%s', args.host, args.port)
        # Run Flask (note: use a production WSGI server in production)
        app.run(host=args.host, port=args.port)


if __name__ == '__main__':
    main()
