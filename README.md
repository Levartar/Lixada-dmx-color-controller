# Lixada-dmx-color-controller
You want to build a wireless dmx controller with you Lixada (or any chinaware dmx usb adapter) adapter and a raspberry pi or any linux chip

## Setup
Clone the repository and enter Lixada-dmx-controller
```
make
```

Enter Backend/ and install Flask server
```
cd Backend/
python3 -m venv .venv
. .venv/bin/activate
pip install Flask
```

update CORS setup to allow Cross Origin requests on the website. On a Raspberry Pi thats usually http://192.168.0.32 You can find your ip address with `ip addr`

```
nano dmx_server.py
```

```
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["<your-ip>"]}})  # Only allow localhost
```

update your index.html to fetch the flask servers ip
```
nano index.html
```

```
fetch('http://<ypur-ip>:5000/api/set_color', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
})
```
Host index.html with your webserver like nginx
```
sudo nano /etc/nginx/sites-available/default
```

```
#new location
location /dmx-colors {
    alias <path-to-index>;
    index index.html;
}
```
reload nginx to make route available
```
sudo systemctl reload nginx
```

## Errors
if you get CORS errors when fetching the server its propably because of firewall issues
```
sudo ufw allow 5000
```
