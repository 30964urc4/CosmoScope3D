from PIL import Image, ImageDraw, ImageFilter
import math

size = 256
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Deep space circle background
center = (128, 128)
bg_radius = 120
draw.ellipse([center[0] - bg_radius, center[1] - bg_radius, center[0] + bg_radius, center[1] + bg_radius], fill=(8, 13, 24, 255), outline=(56, 189, 248, 220), width=4)

# Cosmic nebula glow inside
for r in range(80, 0, -10):
    alpha = int(30 * (1 - r / 80))
    draw.ellipse([center[0] - r, center[1] - r, center[0] + r, center[1] + r], fill=(245, 158, 11, alpha))

# Planet sphere
planet_radius = 48
planet_box = [center[0] - planet_radius, center[1] - planet_radius, center[0] + planet_radius, center[1] + planet_radius]
draw.ellipse(planet_box, fill=(14, 116, 144, 255), outline=(56, 189, 248, 255), width=3)

# Planet highlight
highlight_box = [center[0] - planet_radius + 6, center[1] - planet_radius + 6, center[0] + 10, center[1] + 10]
draw.ellipse(highlight_box, fill=(56, 189, 248, 180))

# Planet Rings (slanted ellipse)
ring_w = 110
ring_h = 32
draw.arc([center[0] - ring_w, center[1] - ring_h, center[0] + ring_w, center[1] + ring_h], start=10, end=170, fill=(245, 158, 11, 240), width=6)
draw.arc([center[0] - ring_w, center[1] - ring_h, center[0] + ring_w, center[1] + ring_h], start=190, end=350, fill=(245, 158, 11, 240), width=6)

# Stars around
stars = [(45, 60), (210, 75), (65, 200), (195, 190), (128, 30), (220, 135)]
for sx, sy in stars:
    draw.ellipse([sx-2, sy-2, sx+2, sy+2], fill=(255, 255, 255, 240))
    draw.line([sx-4, sy, sx+4, sy], fill=(56, 189, 248, 200), width=1)
    draw.line([sx, sy-4, sx, sy+4], fill=(56, 189, 248, 200), width=1)

icon_path = r"C:\Users\izanc\.gemini\antigravity\scratch\universe-map\app_icon.ico"
img.save(icon_path, format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
print(f"Generated {icon_path} successfully!")
