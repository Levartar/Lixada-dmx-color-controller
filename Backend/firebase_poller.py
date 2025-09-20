"""Simple Firebase Realtime Database poller for DMX device.

Usage:
 - Place a Firebase service account JSON at SERVICE_ACCOUNT_PATH
 - Configure DATABASE_URL and DEVICE_ID below
 - Install dependencies: pip install firebase-admin
 - Run: python firebase_poller.py

The poller reads /devices/<DEVICE_ID>/last_command and runs ../dmx_usb when ts changes.
"""
import time
import subprocess
import logging
import os

try:
    import firebase_admin
    from firebase_admin import credentials, db
except Exception:
    firebase_admin = None

SERVICE_ACCOUNT_PATH = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
# Realtime Database URL inferred from Firebase projectId 'dmx-color' in index.html
# If your project uses a different DB host (like '-default-rtdb'), update this URL.
DATABASE_URL = 'https://dmx-color-default-rtdb.europe-west1.firebasedatabase.app/'
# Device id used by the UI (messagingSenderId from your firebase config)
DEVICE_ID = '290688576796'
POLL_INTERVAL = 1.0  # seconds

logging.basicConfig(level=logging.INFO)

def clamp(v):
    try:
        iv = int(v)
    except Exception:
        return 0
    return max(0, min(255, iv))

def run_dmx_change(data):
    args = [
        "../dmx_usb", "change_color",
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
    logging.info("Running DMX: %s", " ".join(args))
    try:
        r = subprocess.run(args, capture_output=True, text=True, timeout=10)
        if r.returncode != 0:
            logging.error("dmx program failed: %s", r.stderr.strip())
    except Exception:
        logging.exception("Failed to run dmx program")

def main():
    if firebase_admin is None:
        logging.error('firebase-admin not installed. Run: pip install firebase-admin')
        return

    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred, {"databaseURL": DATABASE_URL})
    ref = db.reference(f"devices/{DEVICE_ID}/last_command")

    last_ts = 0
    while True:
        try:
            print("Polling for commands...")
            data = ref.get() or {}
            ts = data.get('ts', 0)
            if ts and ts != last_ts:
                last_ts = ts
                run_dmx_change(data)
        except Exception:
            logging.exception('Poll error')
        time.sleep(POLL_INTERVAL)

if __name__ == '__main__':
    main()
