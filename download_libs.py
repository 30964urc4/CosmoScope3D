import urllib.request
import os
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

libs_dir = r"C:\Users\izanc\.gemini\antigravity\scratch\universe-map\libs"
os.makedirs(libs_dir, exist_ok=True)

files = {
    "three.module.js": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "OrbitControls.js": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js"
}

headers = {'User-Agent': 'Mozilla/5.0'}

for fname, url in files.items():
    dest = os.path.join(libs_dir, fname)
    print(f"Downloading {fname}...")
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, context=ctx, timeout=30) as response, open(dest, 'wb') as out_f:
        out_f.write(response.read())
    print(f"Saved {dest}")

print("Downloaded local Three.js libraries successfully.")
