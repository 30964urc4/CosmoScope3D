import os
import sys
import time
import socket
import threading
import subprocess
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Determine the actual folder where the application files reside
if getattr(sys, 'frozen', False):
    DIRECTORY = os.path.dirname(os.path.abspath(sys.executable))
else:
    DIRECTORY = os.path.dirname(os.path.abspath(__file__))

os.chdir(DIRECTORY)
PROFILE_DIR = os.path.join(DIRECTORY, "app_profile")

def find_available_port(start_port=8000):
    port = start_port
    while port < start_port + 50:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
            else:
                # If port is already running our server, test if it responds
                try:
                    import urllib.request
                    res = urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=1)
                    if res.status == 200:
                        return port # Already running and healthy
                except Exception:
                    pass
                port += 1
    return start_port

PORT = find_available_port(8000)

class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    def log_message(self, format, *args):
        pass

def is_server_responding(port):
    try:
        import urllib.request
        res = urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=1)
        return res.status == 200
    except Exception:
        return False

def run_server():
    server = HTTPServer(('127.0.0.1', PORT), QuietHandler)
    server.serve_forever()

def open_app_window():
    url = f"http://localhost:{PORT}/"
    os.makedirs(PROFILE_DIR, exist_ok=True)
    
    # 1. Try Microsoft Edge in standalone App Window Mode
    edge_paths = [
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%LocalAppData%\Microsoft\Edge\Application\msedge.exe"),
    ]
    # 2. Try Google Chrome
    chrome_paths = [
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
    ]

    for exe in edge_paths + chrome_paths:
        if os.path.exists(exe):
            cmd = f'"{exe}" --app="{url}" --user-data-dir="{PROFILE_DIR}" --start-maximized'
            subprocess.Popen(cmd, shell=True)
            return

    # Fallback to default browser
    webbrowser.open(url)

if __name__ == "__main__":
    if not is_server_responding(PORT):
        t = threading.Thread(target=run_server, daemon=True)
        t.start()
        time.sleep(0.6)

    open_app_window()
    
    # Keep server process alive
    while True:
        time.sleep(1)
