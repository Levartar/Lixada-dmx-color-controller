from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import subprocess

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://192.168.0.33"]}})  # Only allow localhost

@app.route('/api/set_color', methods=['POST'])
def set_color():
    data = request.get_json()
    if data is None:
        return jsonify({'message': 'No data received'}), 400  # Handle empty payload
    
    intensity = data.get("intensity", 0)
    red = data.get("red", 0)
    green = data.get("green", 0)
    blue = data.get("blue", 0)
    white = data.get("white", 0)
    amber = data.get("amber", 0)
    violet = data.get("violet", 0)
    strobe = data.get("strobe", 0)
    color_shift = data.get("color_shift", 0)

    # Run the C program with all color and effect parameters
    result = subprocess.run(
        ["../dmx_usb", "change_color", str(intensity), str(red), str(green), str(blue),
        str(white), str(amber), str(violet), str(strobe), str(color_shift)],
        capture_output=True, text=True
    )

    if result.returncode == 0:
        return jsonify({"status": "success", "message": "Color updated"}), 200
    else:
        return jsonify({"status": "error", "message": result.stderr}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
